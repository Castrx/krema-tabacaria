import { NextResponse } from "next/server";
import type { OrderRequestItem } from "@/lib/orders";
import { getShippingQuote, ShippingQuoteValidationError } from "@/lib/shipping/shipping-quote";
import { MelhorEnvioConfigError, MelhorEnvioRequestError } from "@/lib/shipping/melhor-envio";

/**
 * POST /api/checkout/shipping-quote
 *
 * Body: { destinationCep: string; items: { productId: string; variantId?: string; quantity: number }[] }
 * Resposta (200): { options: { serviceId, service, company, priceCents, deliveryDays }[] }
 *
 * Cotação de frete via Melhor Envio (SANDBOX — ver
 * lib/shipping/melhor-envio.ts). Nunca confia em peso/dimensões vindos do
 * client: sempre busca os dados atuais do catálogo no Supabase (ver
 * lib/shipping/shipping-quote.ts). Não cria pedido, não altera estoque,
 * não grava nada no banco — só consulta.
 *
 * Etapa de infraestrutura: nenhum frontend consome este endpoint ainda.
 * Produtos reais da Krema ainda não têm peso/dimensões cadastrados —
 * toda requisição com catálogo real retorna 400 hoje, de propósito
 * (nenhuma cotação usa dado inventado; ver lib/shipping/shipping-quote.ts).
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
          "Formato inválido. Esperado: { destinationCep: string, items: {productId, variantId?, quantity}[] }.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await getShippingQuote(parsed);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ShippingQuoteValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof MelhorEnvioConfigError) {
      // Erro de configuração do servidor (env ausente/inválida), não do
      // pedido do cliente — nunca vaza o valor da env, só a mensagem
      // controlada já sem segredo nenhum.
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (error instanceof MelhorEnvioRequestError) {
      // Falha do lado do Melhor Envio (API fora do ar, CEP não atendido,
      // payload rejeitado etc.) — 502, não 500: o nosso servidor está ok,
      // quem falhou foi o serviço externo.
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type ParsedBody = { destinationCep: string; items: OrderRequestItem[] };

function parseRequestBody(body: unknown): ParsedBody | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;

  if (typeof record.destinationCep !== "string") return null;

  const items = parseItems(record.items);
  if (!items) return null;

  return { destinationCep: record.destinationCep, items };
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
