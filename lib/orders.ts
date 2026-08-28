import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

// Criação de pedidos. Único caminho de escrita em orders/order_items —
// chamado só pela Route Handler app/api/orders/route.ts.
//
// Fluxo: recebe {productId, variantId?, quantity}[] do carrinho → busca
// produtos e variantes atuais no Supabase → valida existência/is_active
// de ambos (e que a variante pertence mesmo ao produto informado) →
// resolve preço no servidor (variant.price_cents ?? product.price_cents)
// → chama a RPC create_order (service role, única forma de gravar) →
// devolve orderId + mensagem do WhatsApp já montada, com a variante
// escolhida quando existir.
//
// Nunca confia em preço/subtotal/nome vindos do cliente — só productId
// (slug), variantId (opcional) e quantity chegam do lado de fora; tudo o
// resto é recalculado aqui.

export class OrderValidationError extends Error {}

export type OrderRequestItem = {
  productId: string;
  variantId?: string;
  quantity: number;
};

type CreateOrderResult = {
  orderId: string;
  message: string;
};

type ProductForOrderRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  is_active: boolean;
};

type VariantForOrderRow = {
  id: string;
  product_id: string;
  sku: string;
  color: string | null;
  model: string | null;
  price_cents: number | null;
  is_active: boolean;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Preço efetivo em centavos: a variante herda o preço do produto quando
 * não tem preço próprio — mesma regra de lib/products.ts, resolvida de
 * novo aqui porque o pedido nunca reaproveita preço vindo do client. */
function unitPriceCents(
  product: ProductForOrderRow,
  variant: VariantForOrderRow | null,
): number {
  return variant?.price_cents ?? product.price_cents;
}

/** "Azul · Torch V2" (ou só um dos dois, ou o SKU se nenhum estiver
 * preenchido) — null quando o item não tem variante. */
function variantLabel(variant: VariantForOrderRow | null): string | null {
  if (!variant) return null;
  return [variant.color, variant.model].filter(Boolean).join(" · ") || variant.sku;
}

/**
 * Mesmo formato de mensagem que WhatsAppOrderLink.tsx já montava no client
 * — só que agora com dados resolvidos no servidor, não do carrinho local.
 */
function buildWhatsAppMessage(lines: string[], subtotalCents: number): string {
  return [
    "Olá! Quero fazer um pedido na Krema:",
    "",
    ...lines,
    "",
    `Subtotal (demonstrativo): ${currencyFormatter.format(subtotalCents / 100)}`,
  ].join("\n");
}

export async function createOrder(
  requestItems: OrderRequestItem[],
): Promise<CreateOrderResult> {
  if (requestItems.length === 0) {
    throw new OrderValidationError(
      "O carrinho está vazio — nenhum pedido foi criado.",
    );
  }

  for (const item of requestItems) {
    if (!item.productId) {
      throw new OrderValidationError("Item do carrinho sem productId.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new OrderValidationError(
        `Quantidade inválida para "${item.productId}" — precisa ser um inteiro maior que zero.`,
      );
    }
  }

  // Busca produtos e variantes atuais — leitura pública, mesma policy que
  // já cobre o catálogo (anon key, sem necessidade de service role para
  // isto). A RLS de product_variants já restringe a variantes ativas de
  // produtos ativos, então uma variante inativa/inexistente simplesmente
  // não volta na consulta — tratado abaixo como "indisponível".
  const slugs = requestItems.map((item) => item.productId);
  const variantIds = Array.from(
    new Set(
      requestItems
        .map((item) => item.variantId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const supabaseRead = getSupabaseServerClient();

  const { data: productsData, error: productsError } = await supabaseRead
    .from("products")
    .select("id, slug, name, price_cents, is_active")
    .in("slug", slugs);

  if (productsError) {
    throw new Error(
      `[lib/orders] Falha ao validar produtos: ${productsError.message}`,
    );
  }

  // Só consulta product_variants quando algum item do carrinho realmente
  // tem variantId — a maioria dos pedidos (produtos sem variante) não
  // precisa dessa segunda ida ao banco.
  let variantsData: VariantForOrderRow[] = [];
  if (variantIds.length > 0) {
    const { data, error: variantsError } = await supabaseRead
      .from("product_variants")
      .select("id, product_id, sku, color, model, price_cents, is_active")
      .in("id", variantIds);

    if (variantsError) {
      throw new Error(
        `[lib/orders] Falha ao validar variantes: ${variantsError.message}`,
      );
    }
    variantsData = data as VariantForOrderRow[];
  }

  const productsBySlug = new Map(
    (productsData as ProductForOrderRow[]).map((product) => [
      product.slug,
      product,
    ]),
  );
  const variantsById = new Map(
    variantsData.map((variant) => [variant.id, variant]),
  );

  // Valida existência/is_active do produto, e — quando há variantId —
  // existência/is_active da variante E que ela pertence mesmo a esse
  // produto (impede mandar productId de um produto com variantId de
  // outro, o que forjaria preço/rótulo errado no pedido). Mantém a ordem
  // do carrinho. Qualquer item inválido rejeita o pedido inteiro — não
  // cria silenciosamente um pedido "parcial" diferente do que o cliente
  // via.
  const invalidItems: string[] = [];
  const resolvedItems: {
    product: ProductForOrderRow;
    variant: VariantForOrderRow | null;
    quantity: number;
  }[] = [];

  for (const item of requestItems) {
    const product = productsBySlug.get(item.productId);
    if (!product || !product.is_active) {
      invalidItems.push(item.productId);
      continue;
    }

    let variant: VariantForOrderRow | null = null;
    if (item.variantId) {
      const found = variantsById.get(item.variantId);
      if (!found || !found.is_active || found.product_id !== product.id) {
        invalidItems.push(`${item.productId} (variante indisponível)`);
        continue;
      }
      variant = found;
    }

    resolvedItems.push({ product, variant, quantity: item.quantity });
  }

  if (invalidItems.length > 0) {
    throw new OrderValidationError(
      `Produto(s)/variante(s) indisponível(is) ou inexistente(s): ${invalidItems.join(", ")}.`,
    );
  }

  // Preço sempre resolvido aqui, a partir do dado atual do banco — nunca do
  // que o cliente enviou.
  const subtotalCents = resolvedItems.reduce(
    (total, { product, variant, quantity }) =>
      total + unitPriceCents(product, variant) * quantity,
    0,
  );

  const messageLines = resolvedItems.map(({ product, variant, quantity }) => {
    const price = unitPriceCents(product, variant);
    const label = variantLabel(variant);
    const name = label ? `${product.name} (${label})` : product.name;
    return `${quantity}x ${name} — ${currencyFormatter.format(price / 100)} (preço demonstrativo)`;
  });
  const message = buildWhatsAppMessage(messageLines, subtotalCents);

  // Grava orders + order_items numa única transação (função RPC no banco —
  // ver supabase/migrations/*_create_order_rpc*.sql). Só a service role
  // pode executar essa função.
  const supabaseService = getSupabaseServiceClient();
  const { data: rpcData, error: rpcError } = await supabaseService.rpc(
    "create_order",
    {
      p_customer_name: null,
      p_customer_phone: null,
      p_subtotal_cents: subtotalCents,
      p_whatsapp_message: message,
      p_items: resolvedItems.map(({ product, variant, quantity }) => ({
        product_id: product.id,
        product_name_snapshot: product.name,
        unit_price_cents_snapshot: unitPriceCents(product, variant),
        quantity,
        variant_id: variant?.id ?? null,
        variant_label_snapshot: variantLabel(variant),
      })),
    },
  );

  if (rpcError) {
    throw new Error(`[lib/orders] Falha ao criar pedido: ${rpcError.message}`);
  }

  const orderId = (rpcData as { order_id: string }[] | null)?.[0]?.order_id;
  if (!orderId) {
    throw new Error(
      "[lib/orders] create_order não retornou order_id — resposta inesperada do banco.",
    );
  }

  return { orderId, message };
}
