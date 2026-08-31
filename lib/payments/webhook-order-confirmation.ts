import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getPayment,
  MercadoPagoPaymentNotFoundError,
  type MercadoPagoPaymentDetails,
} from "@/lib/payments/mercadopago";

// Orquestração do webhook do Mercado Pago: dado um payment_id (já com a
// assinatura verificada pelo caller — ver app/api/webhooks/mercadopago/route.ts
// e lib/payments/mercadopago.ts#verifyWebhookSignature), consulta o
// pagamento REAL na API do Mercado Pago (nunca confia no payload da
// notificação), localiza o pedido pelo external_reference e confirma via
// RPC confirm_order_payment — a única coisa que baixa estoque e confirma
// o pedido nesta etapa. Este módulo nunca faz UPDATE em products/
// product_variants diretamente.

export class WebhookValidationError extends Error {}

/** payment_status que o CHECK de orders já aceita hoje (ver migration
 * *_add_checkout_payment_shipping_columns.sql) — 'approved' é tratado à
 * parte (só ele passa pela RPC confirm_order_payment). */
const KNOWN_NON_APPROVED_STATUSES = new Set(["pending", "rejected", "cancelled", "refunded"]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type WebhookOutcome =
  | { kind: "confirmed"; orderId: string; alreadyProcessed: boolean }
  | { kind: "payment_status_recorded"; orderId: string; paymentStatus: string }
  | { kind: "ignored"; reason: string };

/**
 * Processa uma notificação de pagamento já autenticada (assinatura
 * validada pelo caller). Busca o pagamento real, resolve o pedido e:
 *
 * - status real 'approved' → chama confirm_order_payment (confirma
 *   pedido + baixa estoque atomicamente, idempotente por payment_id).
 * - status real num dos 4 valores que orders.payment_status já aceita
 *   (pending/rejected/cancelled/refunded) → só registra payment_status,
 *   sem tocar status/estoque, e nunca sobrescreve um pedido já
 *   'confirmed' (webhook fora de ordem não pode reverter uma confirmação).
 * - qualquer outro status do Mercado Pago (authorized, in_process,
 *   in_mediation, charged_back, ...) → NÃO grava nada (o CHECK de
 *   payment_status não aceita esses valores — ampliar o CHECK é decisão
 *   fora do escopo desta etapa, ver relatório) — só reconhece a
 *   notificação sem agir.
 */
export async function processPaymentNotification(paymentId: string): Promise<WebhookOutcome> {
  let payment: MercadoPagoPaymentDetails;
  try {
    payment = await getPayment(paymentId);
  } catch (error) {
    if (error instanceof MercadoPagoPaymentNotFoundError) {
      throw new WebhookValidationError(
        `payment_id ${paymentId} não existe no Mercado Pago — notificação rejeitada.`,
      );
    }
    throw error;
  }

  if (!payment.externalReference || !UUID_RE.test(payment.externalReference)) {
    throw new WebhookValidationError(
      `Pagamento ${paymentId} sem external_reference válido (recebido: ${payment.externalReference ?? "ausente"}).`,
    );
  }

  const supabaseService = getSupabaseServiceClient();

  // Confirma que o external_reference corresponde mesmo a um pedido
  // nosso antes de decidir o que fazer — rejeita explicitamente em vez
  // de deixar a RPC (ou um UPDATE sem match) falhar silenciosamente/com
  // erro genérico.
  const { data: orderRow, error: orderLookupError } = await supabaseService
    .from("orders")
    .select("id, status")
    .eq("id", payment.externalReference)
    .maybeSingle();

  if (orderLookupError) {
    throw new Error(
      `[lib/payments/webhook-order-confirmation] Falha ao buscar pedido: ${orderLookupError.message}`,
    );
  }
  if (!orderRow) {
    throw new WebhookValidationError(
      `external_reference ${payment.externalReference} não corresponde a nenhum pedido conhecido.`,
    );
  }

  const paymentIdStr = String(payment.id);

  if (payment.status === "approved") {
    const { data: rpcData, error: rpcError } = await supabaseService.rpc("confirm_order_payment", {
      p_order_id: orderRow.id,
      p_payment_id: paymentIdStr,
      p_payment_status: "approved",
    });

    if (rpcError) {
      throw new Error(
        `[lib/payments/webhook-order-confirmation] confirm_order_payment falhou: ${rpcError.message}`,
      );
    }

    const result = rpcData?.[0] as { already_processed: boolean } | undefined;
    return {
      kind: "confirmed",
      orderId: orderRow.id,
      alreadyProcessed: result?.already_processed ?? false,
    };
  }

  if (KNOWN_NON_APPROVED_STATUSES.has(payment.status)) {
    // Nunca sobrescreve um pedido já confirmado — uma notificação fora
    // de ordem (ex.: 'pending' chegando depois de 'approved' já
    // processado) não pode reverter a confirmação.
    const { error: updateError } = await supabaseService
      .from("orders")
      .update({ payment_status: payment.status })
      .eq("id", orderRow.id)
      .neq("status", "confirmed");

    if (updateError) {
      throw new Error(
        `[lib/payments/webhook-order-confirmation] Falha ao registrar payment_status: ${updateError.message}`,
      );
    }

    return { kind: "payment_status_recorded", orderId: orderRow.id, paymentStatus: payment.status };
  }

  // Vocabulário do Mercado Pago fora do CHECK atual (authorized,
  // in_process, in_mediation, charged_back, ...) — não escreve nada de
  // propósito. Ver relatório desta etapa: decisão de ampliar o CHECK (e
  // criar a migration correspondente) fica pendente de confirmação.
  return { kind: "ignored", reason: `payment.status='${payment.status}' fora do vocabulário atual` };
}
