import { NextResponse } from "next/server";
import { validateDeliveryDetails } from "@/lib/checkout";

/**
 * POST /api/checkout/delivery
 *
 * Body: { delivery: { fullName, phone, cep, street, number, complement,
 *   neighborhood, city, state } } (todos string; complement opcional)
 * Resposta (200): { valid: true }
 * Resposta (400): { valid: false, error: string, fieldErrors: {...} }
 *
 * Primeira etapa do checkout com entrega (venda fora de Arroio do Sal) —
 * SÓ valida os dados de entrega no servidor (nunca confia só na
 * validação do client, ver components/checkout/DeliveryCheckoutForm.tsx).
 * Não cria pedido, não grava nada em orders/order_items, não integra
 * WhatsApp, não calcula frete, não baixa estoque. O fluxo de criação de
 * pedido existente (app/api/orders/route.ts → lib/orders.ts) continua
 * exatamente como estava antes desta etapa — nenhuma alteração ali.
 *
 * Etapa futura: quando frete/pagamento existirem de verdade, este
 * endpoint (ou um sucessor dele) passa a alimentar a criação do pedido
 * com os dados de entrega já validados aqui.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { valid: false, error: "Corpo da requisição inválido (JSON esperado)." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("delivery" in body) ||
    typeof (body as { delivery: unknown }).delivery !== "object" ||
    (body as { delivery: unknown }).delivery === null
  ) {
    return NextResponse.json(
      {
        valid: false,
        error: "Campo 'delivery' inválido — esperado objeto com os dados de entrega.",
      },
      { status: 400 },
    );
  }

  const raw = (body as { delivery: Record<string, unknown> }).delivery;
  const result = validateDeliveryDetails(raw);

  if (!result.valid) {
    return NextResponse.json(
      {
        valid: false,
        error: "Dados de entrega inválidos.",
        fieldErrors: result.errors,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ valid: true }, { status: 200 });
}
