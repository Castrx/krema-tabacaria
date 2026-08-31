// Integração isolada com a API REST do Melhor Envio (cálculo de frete).
//
// Não existe SDK oficial em Node para o Melhor Envio — a integração é
// feita direto via fetch (já embutido no runtime do Next.js/Node);
// nenhuma dependência nova precisou ser instalada para este módulo.
//
// Este módulo não sabe nada sobre Supabase, carrinho ou produtos — só
// recebe itens já resolvidos (peso/dimensões reais do catálogo, ver
// lib/shipping/shipping-quote.ts) e devolve as opções de frete que o
// Melhor Envio calculou. Nenhum outro módulo deste projeto deve chamar a
// API do Melhor Envio diretamente; tudo passa por aqui.
//
// Etapa atual: SOMENTE sandbox. Nenhuma integração de frontend ainda, e
// nenhuma cotação real acontece de verdade nesta etapa — os produtos
// reais da Krema ainda não têm peso/dimensões cadastrados (ver
// lib/shipping/shipping-quote.ts), então toda chamada com catálogo real
// é rejeitada antes de chegar aqui.

export class MelhorEnvioConfigError extends Error {}
export class MelhorEnvioRequestError extends Error {}

/** Sandbox do Melhor Envio — ambiente isolado de teste, sem cobrança nem
 * etiqueta reais. Trocar para produção
 * (https://melhorenvio.com.br/api/v2) é decisão explícita de uma etapa
 * futura própria, nunca por acidente — por isso fixo no código, não em
 * env var (mesmo raciocínio do SITE_URL fixo em
 * lib/payments/mercadopago.ts). */
const MELHOR_ENVIO_BASE_URL = "https://sandbox.melhorenvio.com.br/api/v2";

function getMelhorEnvioConfig(): { accessToken: string; userAgent: string } {
  const accessToken = process.env.MELHORENVIO_ACCESS_TOKEN;
  const userAgent = process.env.MELHORENVIO_USER_AGENT;

  if (!accessToken || accessToken.trim().length === 0) {
    throw new MelhorEnvioConfigError(
      "Melhor Envio não configurado: defina MELHORENVIO_ACCESS_TOKEN em .env.local (ver .env.example) com um token de uma conta sandbox.",
    );
  }

  if (!userAgent || userAgent.trim().length === 0) {
    // A API do Melhor Envio exige um header User-Agent identificando a
    // aplicação + um contato (formato "Nome da aplicação (email)") — sem
    // isso, a API rejeita a requisição. Não inventamos um e-mail de
    // contato aqui: precisa ser um dado real da Krema (ver .env.example
    // e o relatório desta etapa).
    throw new MelhorEnvioConfigError(
      "Melhor Envio não configurado: defina MELHORENVIO_USER_AGENT em .env.local, formato 'Nome da aplicação (email de contato)' — exigido pela API do Melhor Envio.",
    );
  }

  return { accessToken, userAgent };
}

export type MelhorEnvioAddress = {
  /** 8 dígitos, sem hífen. */
  postalCode: string;
};

export type MelhorEnvioProductInput = {
  /** Id só informativo pro Melhor Envio (não é chave de nada do nosso
   * lado) — usamos o id da variante quando existir, senão o do produto. */
  id: string;
  widthCm: number;
  heightCm: number;
  lengthCm: number;
  weightKg: number;
  insuranceValueCents: number;
  quantity: number;
};

export type CalculateShipmentInput = {
  from: MelhorEnvioAddress;
  to: MelhorEnvioAddress;
  /** Um item por linha do carrinho (não um "pacote" já consolidado) — o
   * próprio Melhor Envio calcula a embalagem resultante a partir da lista
   * de produtos individuais; não implementamos nenhum algoritmo de
   * empacotamento nosso (ver comentário em lib/shipping/shipping-quote.ts). */
  products: MelhorEnvioProductInput[];
};

export type ShippingQuoteOption = {
  serviceId: number;
  service: string;
  company: string;
  priceCents: number;
  /** Prazo estimado em dias úteis — null quando o Melhor Envio não
   * devolveu essa informação para a opção. */
  deliveryDays: number | null;
};

export type CalculateShipmentResult = {
  options: ShippingQuoteOption[];
};

function centsFromReaisString(value: string): number {
  const amount = Number.parseFloat(value);
  return Math.round(amount * 100);
}

/**
 * Calcula as opções de frete disponíveis para um destino, a partir de
 * itens já resolvidos (peso/dimensões reais do catálogo — ver
 * lib/shipping/shipping-quote.ts, que nunca confia no que o client
 * mandaria). Não cria pedido, não reserva nada, não gera etiqueta — só
 * consulta preço/prazo.
 */
export async function calculateShipment(
  input: CalculateShipmentInput,
): Promise<CalculateShipmentResult> {
  const { accessToken, userAgent } = getMelhorEnvioConfig();

  let response: Response;
  try {
    response = await fetch(`${MELHOR_ENVIO_BASE_URL}/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        from: { postal_code: input.from.postalCode },
        to: { postal_code: input.to.postalCode },
        products: input.products.map((product) => ({
          id: product.id,
          width: product.widthCm,
          height: product.heightCm,
          length: product.lengthCm,
          weight: product.weightKg,
          insurance_value: product.insuranceValueCents / 100,
          quantity: product.quantity,
        })),
      }),
    });
  } catch (error) {
    throw new MelhorEnvioRequestError(
      `Falha ao consultar o Melhor Envio: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new MelhorEnvioRequestError(
      `Melhor Envio retornou ${response.status} ao calcular frete: ${bodyText.slice(0, 500)}`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MelhorEnvioRequestError("Resposta do Melhor Envio não é um JSON válido.");
  }

  if (!Array.isArray(payload)) {
    throw new MelhorEnvioRequestError(
      "Resposta inesperada do Melhor Envio ao calcular frete (esperado um array de opções).",
    );
  }

  const options: ShippingQuoteOption[] = [];
  for (const raw of payload) {
    if (typeof raw !== "object" || raw === null) continue;
    const entry = raw as Record<string, unknown>;

    // Entradas com `error` preenchido são serviços indisponíveis pra essa
    // rota/pacote específico (ex.: transportadora não atende o CEP, ou
    // pacote fora dos limites dela) — não invalida a resposta inteira,
    // só fica de fora das opções devolvidas.
    if (entry.error) continue;
    if (
      typeof entry.price !== "string" ||
      typeof entry.id !== "number" ||
      typeof entry.name !== "string"
    ) {
      continue;
    }

    const company = entry.company as Record<string, unknown> | undefined;
    const companyName = typeof company?.name === "string" ? company.name : "Transportadora";
    const deliveryTime = typeof entry.delivery_time === "number" ? entry.delivery_time : null;

    options.push({
      serviceId: entry.id,
      service: entry.name,
      company: companyName,
      priceCents: centsFromReaisString(entry.price),
      deliveryDays: deliveryTime,
    });
  }

  return { options };
}
