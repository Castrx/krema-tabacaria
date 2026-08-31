import {
  MercadoPagoConfig,
  Preference,
  Payment,
  MPNotFoundError,
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
  SignatureFailureReason,
} from "mercadopago";

// Integração isolada com o SDK oficial do Mercado Pago (Checkout Pro +
// consulta de pagamento + validação de assinatura de webhook). Este
// módulo não sabe nada sobre Supabase, carrinho ou pedidos — só recebe
// dados já resolvidos/validados (ver lib/payments/checkout-order.ts e
// lib/payments/webhook-order-confirmation.ts) e fala com o SDK. Nenhum
// outro módulo deste projeto deve importar o pacote "mercadopago"
// diretamente; tudo passa por aqui.
//
// Etapa atual: SOMENTE sandbox.

export class MercadoPagoConfigError extends Error {}
export class MercadoPagoRequestError extends Error {}
export class MercadoPagoPaymentNotFoundError extends Error {}

// Reexportados em vez de o caller importar "mercadopago" diretamente —
// mesmo raciocínio do resto do arquivo: o pacote do SDK só é importado
// aqui dentro.
export { InvalidWebhookSignatureError, SignatureFailureReason };

/** Domínio fixo pedido pela etapa atual — não lido de env nem inferido da
 * requisição, para nunca gerar back_urls apontando pra localhost/preview
 * por engano. */
const SITE_URL = "https://krematabacaria.com.br";

/**
 * Instancia o client do SDK a partir do access token de sandbox — lido só
 * aqui dentro, nunca em outro módulo. Sem estado global (uma instância nova
 * por chamada, mesmo padrão de getSupabaseServiceClient em
 * lib/supabase/service.ts): é um wrapper leve sobre chamadas HTTP, não há
 * nada caro para reaproveitar entre chamadas.
 *
 * Só faz uma checagem de forma mínima (não vazio, prefixo reconhecido) —
 * NÃO é uma garantia de que o token é de sandbox. O Mercado Pago não
 * expõe hoje uma forma confiável de distinguir teste de produção só pelo
 * formato da string: tokens de "Credenciais de teste" do Checkout Pro
 * também vêm como "APP_USR-...", o mesmo prefixo usado em produção (só o
 * legado "TEST-..." é inequívoco). A garantia real de que isto é
 * sandbox-only, nesta etapa, é procedimental — confirmar que o valor
 * salvo em MERCADOPAGO_ACCESS_TOKEN veio mesmo de "Dados da integração →
 * Testes → Credenciais de teste" no painel do Mercado Pago, nunca da aba
 * de credenciais de produção — não algo que este guard consiga verificar
 * sozinho.
 */
function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken || accessToken.trim().length === 0) {
    throw new MercadoPagoConfigError(
      "Mercado Pago não configurado: defina MERCADOPAGO_ACCESS_TOKEN em .env.local (ver .env.example) com um access token de TESTE.",
    );
  }

  if (!accessToken.startsWith("TEST-") && !accessToken.startsWith("APP_USR-")) {
    throw new MercadoPagoConfigError(
      "MERCADOPAGO_ACCESS_TOKEN não parece um access token válido do Mercado Pago (esperado prefixo 'TEST-' ou 'APP_USR-').",
    );
  }

  return new MercadoPagoConfig({ accessToken });
}

export type PreferenceItemInput = {
  /** Id do que representa o item pro Mercado Pago (variante quando
   * existir, senão o produto) — só informativo do lado deles, não é
   * chave de nada no nosso banco. */
  id: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
};

export type CreatePaymentPreferenceInput = {
  /** orders.id do pedido já gravado como 'pending' — vira
   * external_reference, o campo que o futuro webhook usa pra religar a
   * notificação de pagamento ao pedido certo. */
  orderId: string;
  items: PreferenceItemInput[];
};

export type PaymentPreferenceResult = {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
};

function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

/**
 * Cria uma preferência do Checkout Pro para um pedido já gravado como
 * 'pending' (ver lib/payments/checkout-order.ts). Não confirma pagamento,
 * não confirma pedido, não baixa estoque, não preenche orders.payment_id —
 * só gera a preferência que um futuro frontend vai usar para redirecionar
 * o cliente ao Checkout Pro (integração de frontend é etapa futura, fora
 * deste escopo).
 */
export async function createPaymentPreference(
  input: CreatePaymentPreferenceInput,
): Promise<PaymentPreferenceResult> {
  const client = getMercadoPagoClient();
  const preferenceClient = new Preference(client);

  let response;
  try {
    response = await preferenceClient.create({
      body: {
        items: input.items.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          currency_id: "BRL",
          unit_price: centsToAmount(item.unitPriceCents),
        })),
        external_reference: input.orderId,
        // As três páginas abaixo ainda não existem — são responsabilidade
        // da etapa futura de frontend. O Mercado Pago aceita a preferência
        // mesmo assim; só falharia se o comprador de fato voltasse pra cá
        // antes de essas páginas existirem, o que não acontece nesta etapa
        // (nenhum frontend chama este endpoint ainda).
        back_urls: {
          success: `${SITE_URL}/checkout/sucesso`,
          pending: `${SITE_URL}/checkout/pendente`,
          failure: `${SITE_URL}/checkout/erro`,
        },
        auto_return: "approved",
      },
      requestOptions: {
        // Determinístico por pedido: um retry da MESMA criação de
        // preferência (mesmo orderId) reaproveita a preferência já criada
        // no Mercado Pago em vez de gerar uma segunda — complementa o
        // dedup de pedidos em checkout-order.ts, só que resolvido pelo
        // próprio Mercado Pago (sem idempotencyKey explícita, o SDK
        // geraria uma aleatória por chamada, o que não ajudaria em nada).
        idempotencyKey: `krema-order-${input.orderId}`,
      },
    });
  } catch (error) {
    throw new MercadoPagoRequestError(
      `Falha ao criar preferência de pagamento no Mercado Pago: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (!response.id || !response.init_point || !response.sandbox_init_point) {
    throw new MercadoPagoRequestError(
      "Resposta inesperada do Mercado Pago ao criar preferência (campos obrigatórios ausentes).",
    );
  }

  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
  };
}

export type MercadoPagoPaymentDetails = {
  id: number;
  /** Status "real" do pagamento, direto da API (nunca do payload do
   * webhook) — ver requisito 9 do webhook: só trata como aprovado se
   * ESTE campo, consultado agora, disser 'approved'. */
  status: string;
  statusDetail: string | null;
  /** orders.id do pedido que originou o pagamento — null quando o
   * Mercado Pago não devolveu nenhum (pagamento nunca associado a uma
   * preferência nossa). */
  externalReference: string | null;
};

/**
 * Consulta um pagamento diretamente na API do Mercado Pago pelo id —
 * nunca confia no status/valor que viria só do corpo da notificação do
 * webhook (ver lib/payments/webhook-order-confirmation.ts). Lança
 * MercadoPagoPaymentNotFoundError especificamente para "esse payment_id
 * não existe" (404), distinto de outras falhas, porque o webhook trata
 * os dois casos de forma diferente (payment_id inexistente é erro de
 * requisição — 400; falha genérica do Mercado Pago é 502).
 */
export async function getPayment(paymentId: string): Promise<MercadoPagoPaymentDetails> {
  const client = getMercadoPagoClient();
  const paymentClient = new Payment(client);

  let response;
  try {
    response = await paymentClient.get({ id: paymentId });
  } catch (error) {
    if (error instanceof MPNotFoundError) {
      throw new MercadoPagoPaymentNotFoundError(
        `Pagamento ${paymentId} não encontrado no Mercado Pago.`,
      );
    }
    throw new MercadoPagoRequestError(
      `Falha ao consultar o pagamento ${paymentId} no Mercado Pago: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (typeof response.id !== "number" || typeof response.status !== "string") {
    throw new MercadoPagoRequestError(
      `Resposta inesperada do Mercado Pago ao consultar o pagamento ${paymentId} (campos obrigatórios ausentes).`,
    );
  }

  return {
    id: response.id,
    status: response.status,
    statusDetail: response.status_detail ?? null,
    externalReference: response.external_reference ?? null,
  };
}

/**
 * Valida a assinatura de uma notificação de webhook do Mercado Pago —
 * usa o validador oficial do SDK (WebhookSignatureValidator), não uma
 * reimplementação própria do HMAC. Lança InvalidWebhookSignatureError
 * (reexportado acima) quando a assinatura falha por qualquer motivo
 * (cabeçalho ausente/malformado, hash não bate, timestamp fora da
 * tolerância) — a razão específica fica em error.reason.
 *
 * MERCADOPAGO_WEBHOOK_SECRET é um segredo DIFERENTE do access token: é a
 * "Assinatura secreta" gerada quando a URL do webhook é configurada em
 * "Dados da integração → Webhooks" no painel do Mercado Pago — não a
 * mesma credencial usada em getMercadoPagoClient().
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): void {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new MercadoPagoConfigError(
      "Mercado Pago não configurado: defina MERCADOPAGO_WEBHOOK_SECRET em .env.local (ver .env.example) com a assinatura secreta do painel de Webhooks.",
    );
  }

  WebhookSignatureValidator.validate({
    xSignature: params.xSignature,
    xRequestId: params.xRequestId,
    dataId: params.dataId,
    secret,
    // Janela de tolerância contra replay de uma notificação antiga
    // reenviada/capturada — 5 minutos é folgado o suficiente pra
    // qualquer drift de relógio razoável entre servidores.
    toleranceSeconds: 300,
  });
}
