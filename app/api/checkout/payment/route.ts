import { NextResponse } from "next/server";
import { validateDeliveryDetails, type RawDeliveryFormInput } from "@/lib/checkout";
import type { OrderRequestItem } from "@/lib/orders";
import {
  createPendingCheckoutOrder,
  CheckoutPaymentValidationError,
  type ShippingSelectionInput,
} from "@/lib/payments/checkout-order";
import {
  createPaymentPreference,
  MercadoPagoConfigError,
  MercadoPagoRequestError,
} from "@/lib/payments/mercadopago";

/**
 * POST /api/checkout/payment
 *
 * Body: {
 *   items: { productId: string; variantId?: string; quantity: number }[];
 *   delivery: { fullName, phone, cep, street, number, complement?, neighborhood, city, state };
 *   shipping?: { service: string; costCents: number };
 * }
 * Resposta (201): { orderId, preferenceId, initPoint, sandboxInitPoint, totalCents }
 *
 * Cria um pedido 'pending' (payment_status='pending', total_cents já
 * somando frete quando informado — ver lib/payments/checkout-order.ts) e
 * gera a preferência de pagamento correspondente no Mercado Pago
 * (SANDBOX — ver lib/payments/mercadopago.ts). Preço/subtotal/total NUNCA
 * vêm do client: tudo é resolvido a partir do catálogo atual no Supabase.
 *
 * Etapa de infraestrutura: nenhum frontend consome este endpoint ainda.
 * Não confirma pagamento, não confirma pedido, não baixa estoque, não
 * preenche payment_id — isso é responsabilidade exclusiva da RPC
 * confirm_order_payment, chamada só pelo futuro webhook do Mercado Pago.
 * O fluxo de WhatsApp (app/api/orders/route.ts → lib/orders.ts) não é
 * tocado por este arquivo.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido (JSON esperado)." },
      { status: 400 },
    );
  }

  const parsed = parseRequestBody(body);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "Formato inválido. Esperado: { items: {productId, variantId?, quantity}[], delivery: {...}, shipping?: {service, costCents} }.",
      },
      { status: 400 },
    );
  }

  const deliveryResult = validateDeliveryDetails(parsed.delivery);
  if (!deliveryResult.valid) {
    return NextResponse.json(
      { error: "Dados de entrega inválidos.", fieldErrors: deliveryResult.errors },
      { status: 400 },
    );
  }

  try {
    const order = await createPendingCheckoutOrder({
      items: parsed.items,
      delivery: deliveryResult.value,
      shipping: parsed.shipping,
    });

    const preference = await createPaymentPreference({
      orderId: order.orderId,
      items: order.items.map((item) => ({
        id: item.mpItemId,
        title: item.title,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
    });

    return NextResponse.json(
      {
        orderId: order.orderId,
        preferenceId: preference.preferenceId,
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint,
        totalCents: order.totalCents,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CheckoutPaymentValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof MercadoPagoConfigError) {
      // Erro de configuração do servidor (env ausente/inválida), não do
      // pedido do cliente — nunca vaza o valor da env, só a mensagem
      // controlada já sem segredo nenhum (ver lib/payments/mercadopago.ts).
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (error instanceof MercadoPagoRequestError) {
      // Falha do lado do Mercado Pago (API fora do ar, payload rejeitado
      // etc.) — 502, não 500: o nosso servidor está ok, quem falhou foi o
      // serviço externo.
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    // Não esconde o erro: devolve a mensagem real para diagnóstico, em vez
    // de fingir sucesso.
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type ParsedBody = {
  items: OrderRequestItem[];
  delivery: RawDeliveryFormInput;
  shipping?: ShippingSelectionInput;
};

function parseRequestBody(body: unknown): ParsedBody | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;

  const items = parseItems(record.items);
  if (!items) return null;

  if (typeof record.delivery !== "object" || record.delivery === null) return null;
  const delivery = record.delivery as RawDeliveryFormInput;

  let shipping: ShippingSelectionInput | undefined;
  if (record.shipping !== undefined) {
    if (typeof record.shipping !== "object" || record.shipping === null) return null;
    const { service, costCents } = record.shipping as Record<string, unknown>;
    if (typeof service !== "string" || typeof costCents !== "number") return null;
    shipping = { service, costCents };
  }

  return { items, delivery, shipping };
}

function parseItems(raw: unknown): OrderRequestItem[] | null {
  if (!Array.isArray(raw)) return null;
  const parsed: OrderRequestItem[] = [];

  for (const rawItem of raw) {
    if (typeof rawItem !== "object" || rawItem === null) return null;

    const { productId, variantId, quantity } = rawItem as Record<string, unknown>;
    if (typeof productId !== "string" || typeof quantity !== "number") {
      return null;
    }
    if (variantId !== undefined && typeof variantId !== "string") {
      return null;
    }

    parsed.push({ productId, variantId: variantId as string | undefined, quantity });
  }

  return parsed;
}
