import { NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  MercadoPagoConfigError,
  MercadoPagoRequestError,
  InvalidWebhookSignatureError,
} from "@/lib/payments/mercadopago";
import {
  processPaymentNotification,
  WebhookValidationError,
} from "@/lib/payments/webhook-order-confirmation";

/**
 * POST /api/webhooks/mercadopago
 *
 * Recebe as notificações do Mercado Pago (Checkout Pro, SANDBOX).
 *
 * Fluxo: valida a assinatura (x-signature + x-request-id, contra
 * MERCADOPAGO_WEBHOOK_SECRET — ver lib/payments/mercadopago.ts) →
 * ignora notificações que não são de pagamento (merchant_order etc.) →
 * consulta o pagamento DE VERDADE na API do Mercado Pago pelo id →
 * localiza o pedido por external_reference → chama confirm_order_payment
 * (única coisa que confirma o pedido e baixa estoque, atomicamente e de
 * forma idempotente — ver supabase/migrations/*_create_confirm_order_payment_rpc.sql).
 *
 * Nunca confia no status/payment_id só do corpo da notificação — o corpo
 * de uma notificação do Mercado Pago é só um aviso de "algo mudou,
 * confira você mesmo"; o dado usado pra decidir qualquer coisa vem
 * sempre de uma consulta direta à API deles.
 *
 * Não altera o fluxo de WhatsApp, não integra Melhor Envio, não baixa
 * estoque diretamente (isso é exclusividade da RPC).
 *
 * Respostas: 200 processado (inclusive replay já processado antes —
 * idempotente pela RPC) | 400 payload/assinatura de dado inválido | 401
 * assinatura inválida | 500 erro interno controlado. O Mercado Pago
 * reenvia a notificação em qualquer resposta fora da faixa 200-299.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  // Formato atual: ?data.id=...&type=payment. Formato legado (IPN):
  // ?id=...&topic=payment. Aceita os dois — o Mercado Pago ainda pode
  // usar o legado em alguns fluxos.
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const notificationType = url.searchParams.get("type") ?? url.searchParams.get("topic");

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  try {
    // Assinatura verificada ANTES de qualquer outra decisão (inclusive
    // antes de olhar o tipo da notificação) — nenhum branch deste
    // handler roda a partir de um payload ainda não autenticado.
    verifyWebhookSignature({ xSignature, xRequestId, dataId });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return NextResponse.json(
        { error: "Assinatura inválida.", reason: error.reason },
        { status: 401 },
      );
    }
    if (error instanceof MercadoPagoConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    throw error;
  }

  if (!dataId) {
    return NextResponse.json(
      { error: "Notificação sem data.id — payload inválido." },
      { status: 400 },
    );
  }

  // Só "payment" nos interessa nesta etapa — o Mercado Pago manda outros
  // tipos (merchant_order, etc.) pra essa mesma URL; reconhece com 200 e
  // não processa, em vez de tratar como erro.
  if (notificationType && notificationType !== "payment") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const outcome = await processPaymentNotification(dataId);
    return NextResponse.json({ received: true, outcome: outcome.kind }, { status: 200 });
  } catch (error) {
    if (error instanceof WebhookValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof MercadoPagoConfigError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (error instanceof MercadoPagoRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
