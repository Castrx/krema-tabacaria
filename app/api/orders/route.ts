import { NextResponse } from "next/server";
import {
  createOrder,
  OrderValidationError,
  type OrderRequestItem,
} from "@/lib/orders";

/**
 * POST /api/orders
 *
 * Body: { items: { productId: string; variantId?: string; quantity: number }[] }
 * Resposta (201): { orderId: string; message: string }
 *
 * Recebe só productId + variantId (opcional) + quantity do carrinho —
 * preço, nome, rótulo da variante e subtotal são sempre resolvidos no
 * servidor (lib/orders.ts), nunca aceitos do cliente. Grava o pedido via
 * lib/orders.ts, que usa a service role só para a escrita em
 * orders/order_items (sem policy pública de INSERT).
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

  const items = parseRequestItems(body);
  if (!items) {
    return NextResponse.json(
      {
        error:
          "Formato inválido. Esperado: { items: { productId: string, variantId?: string, quantity: number }[] }.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createOrder(items);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Não esconde o erro: devolve a mensagem real para diagnóstico, em vez
    // de fingir sucesso.
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseRequestItems(body: unknown): OrderRequestItem[] | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("items" in body) ||
    !Array.isArray((body as { items: unknown }).items)
  ) {
    return null;
  }

  const rawItems = (body as { items: unknown[] }).items;
  const parsed: OrderRequestItem[] = [];

  for (const rawItem of rawItems) {
    if (typeof rawItem !== "object" || rawItem === null) return null;

    const { productId, variantId, quantity } = rawItem as Record<
      string,
      unknown
    >;
    if (typeof productId !== "string" || typeof quantity !== "number") {
      return null;
    }
    // variantId é opcional, mas se vier precisa ser string (nunca aceita
    // silenciosamente um tipo errado, ex.: number ou objeto).
    if (variantId !== undefined && typeof variantId !== "string") {
      return null;
    }

    parsed.push({
      productId,
      variantId: variantId as string | undefined,
      quantity,
    });
  }

  return parsed;
}
