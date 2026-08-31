import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { DeliveryDetails } from "@/types/checkout";
import type { OrderRequestItem } from "@/lib/orders";

// Resolução + criação do pedido 'pending' que antecede a preferência do
// Mercado Pago (Checkout Pro). Caminho de escrita PARALELO a
// lib/orders.ts — não usa a RPC create_order (que não tem os campos de
// pagamento/frete, e não deveria: pedido de WhatsApp nunca teve, nem tem,
// pagamento online) e não altera nada do fluxo de WhatsApp. Mesma tabela,
// mesma service role, propósito diferente: WhatsApp nasce com
// payment_status NULL (nenhum pagamento online associado); este caminho
// nasce com payment_status='pending' (tem pagamento online, ainda não
// decidido) — ver supabase/migrations/*_add_checkout_payment_shipping_columns.sql.
//
// Não confirma pedido, não baixa estoque, não preenche payment_id — isso é
// responsabilidade exclusiva da RPC confirm_order_payment, chamada só pelo
// futuro webhook do Mercado Pago.

export class CheckoutPaymentValidationError extends Error {}

export type ShippingSelectionInput = {
  service: string;
  costCents: number;
};

type ProductForCheckoutRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  is_active: boolean;
  stock_quantity: number;
};

type VariantForCheckoutRow = {
  id: string;
  product_id: string;
  sku: string;
  color: string | null;
  model: string | null;
  price_cents: number | null;
  is_active: boolean;
  stock_quantity: number;
};

export type ResolvedCheckoutItem = {
  /** Id do que vai representar o item na preferência do Mercado Pago —
   * variante quando existir, senão o produto. */
  mpItemId: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
  productId: string;
  variantId: string | null;
  productNameSnapshot: string;
  variantLabelSnapshot: string | null;
};

export type CreatePendingCheckoutOrderInput = {
  items: OrderRequestItem[];
  delivery: DeliveryDetails;
  shipping?: ShippingSelectionInput;
};

export type CreatePendingCheckoutOrderResult = {
  orderId: string;
  totalCents: number;
  subtotalCents: number;
  items: ResolvedCheckoutItem[];
};

function unitPriceCents(
  product: ProductForCheckoutRow,
  variant: VariantForCheckoutRow | null,
): number {
  return variant?.price_cents ?? product.price_cents;
}

function variantLabel(variant: VariantForCheckoutRow | null): string | null {
  if (!variant) return null;
  return [variant.color, variant.model].filter(Boolean).join(" · ") || variant.sku;
}

function availableStock(
  product: ProductForCheckoutRow,
  variant: VariantForCheckoutRow | null,
): number {
  // Mesmo critério de confirm_order_payment (ver migration da RPC):
  // variant_id presente → estoque é o da variante; senão, o do produto.
  return variant ? variant.stock_quantity : product.stock_quantity;
}

/**
 * Busca produtos/variantes atuais, valida cada item do carrinho (existe,
 * ativo, variante pertence ao produto, quantity > 0) e resolve preço/rótulo
 * — mesmo critério de lib/orders.ts (WhatsApp), com uma checagem extra que
 * o fluxo de WhatsApp não precisa: estoque suficiente.
 *
 * Importante: esta checagem de estoque é preliminar/UX — evita gerar uma
 * preferência de pagamento pra um pedido já fadado a falhar. Não é a
 * garantia atômica de verdade (estoque pode mudar entre agora e o
 * pagamento ser aprovado); essa garantia é a RPC confirm_order_payment, que
 * trava e reconfere tudo de novo no momento da confirmação.
 */
async function resolveItems(
  requestItems: OrderRequestItem[],
): Promise<ResolvedCheckoutItem[]> {
  if (requestItems.length === 0) {
    throw new CheckoutPaymentValidationError(
      "O carrinho está vazio — nenhuma preferência de pagamento foi criada.",
    );
  }

  for (const item of requestItems) {
    if (!item.productId) {
      throw new CheckoutPaymentValidationError("Item do carrinho sem productId.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new CheckoutPaymentValidationError(
        `Quantidade inválida para "${item.productId}" — precisa ser um inteiro maior que zero.`,
      );
    }
  }

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
    .select("id, slug, name, price_cents, is_active, stock_quantity")
    .in("slug", slugs);

  if (productsError) {
    throw new Error(
      `[lib/payments/checkout-order] Falha ao validar produtos: ${productsError.message}`,
    );
  }

  let variantsData: VariantForCheckoutRow[] = [];
  if (variantIds.length > 0) {
    const { data, error: variantsError } = await supabaseRead
      .from("product_variants")
      .select("id, product_id, sku, color, model, price_cents, is_active, stock_quantity")
      .in("id", variantIds);

    if (variantsError) {
      throw new Error(
        `[lib/payments/checkout-order] Falha ao validar variantes: ${variantsError.message}`,
      );
    }
    variantsData = data as VariantForCheckoutRow[];
  }

  const productsBySlug = new Map(
    (productsData as ProductForCheckoutRow[]).map((product) => [product.slug, product]),
  );
  const variantsById = new Map(variantsData.map((variant) => [variant.id, variant]));

  const invalidItems: string[] = [];
  const insufficientStock: string[] = [];
  const resolved: ResolvedCheckoutItem[] = [];

  for (const item of requestItems) {
    const product = productsBySlug.get(item.productId);
    if (!product || !product.is_active) {
      invalidItems.push(item.productId);
      continue;
    }

    let variant: VariantForCheckoutRow | null = null;
    if (item.variantId) {
      const found = variantsById.get(item.variantId);
      if (!found || !found.is_active || found.product_id !== product.id) {
        invalidItems.push(`${item.productId} (variante indisponível)`);
        continue;
      }
      variant = found;
    }

    const label = variantLabel(variant);
    const available = availableStock(product, variant);
    if (available < item.quantity) {
      insufficientStock.push(
        `${product.name}${label ? ` (${label})` : ""}: disponível=${available}, pedido=${item.quantity}`,
      );
      continue;
    }

    const price = unitPriceCents(product, variant);
    resolved.push({
      mpItemId: variant?.id ?? product.id,
      title: label ? `${product.name} (${label})` : product.name,
      quantity: item.quantity,
      unitPriceCents: price,
      productId: product.id,
      variantId: variant?.id ?? null,
      productNameSnapshot: product.name,
      variantLabelSnapshot: label,
    });
  }

  if (invalidItems.length > 0) {
    throw new CheckoutPaymentValidationError(
      `Produto(s)/variante(s) indisponível(is) ou inexistente(s): ${invalidItems.join(", ")}.`,
    );
  }
  if (insufficientStock.length > 0) {
    throw new CheckoutPaymentValidationError(
      `Estoque insuficiente: ${insufficientStock.join("; ")}.`,
    );
  }

  return resolved;
}

function validateShipping(
  shipping: ShippingSelectionInput | undefined,
): { costCents: number | null; service: string | null } {
  // "Somar frete somente se um valor válido for recebido nesta etapa" —
  // ausente = pedido nasce sem frete calculado ainda (nem todo checkout
  // desta etapa inicial precisa ter cotação disponível no momento da
  // preferência). Presente e inválido = erro, não "ignora silenciosamente".
  if (shipping === undefined) {
    return { costCents: null, service: null };
  }

  const service = shipping.service?.trim();
  if (!service) {
    throw new CheckoutPaymentValidationError(
      "shipping.service inválido — informe o nome do serviço de frete escolhido.",
    );
  }
  if (!Number.isInteger(shipping.costCents) || shipping.costCents < 0) {
    throw new CheckoutPaymentValidationError(
      "shipping.costCents inválido — precisa ser um inteiro >= 0 (centavos).",
    );
  }

  return { costCents: shipping.costCents, service };
}

type SupabaseServiceClient = ReturnType<typeof getSupabaseServiceClient>;

function itemsSignature(
  items: {
    product_id: string | null;
    variant_id: string | null;
    quantity: number;
    unit_price_cents_snapshot: number;
  }[],
): string {
  return items
    .map((i) => `${i.product_id ?? ""}:${i.variant_id ?? ""}:${i.quantity}:${i.unit_price_cents_snapshot}`)
    .sort()
    .join("|");
}

function deliveryMatches(stored: unknown, wanted: DeliveryDetails): boolean {
  if (typeof stored !== "object" || stored === null) return false;
  const s = stored as Record<string, unknown>;
  return (
    s.fullName === wanted.fullName &&
    s.phone === wanted.phone &&
    s.cep === wanted.cep &&
    s.street === wanted.street &&
    s.number === wanted.number &&
    (s.complement ?? "") === (wanted.complement ?? "") &&
    s.neighborhood === wanted.neighborhood &&
    s.city === wanted.city &&
    s.state === wanted.state
  );
}

/** Janela de reaproveitamento — ver comentário de findReusablePendingOrder. */
const DEDUP_WINDOW_MINUTES = 15;

/**
 * Best-effort: evita criar um SEGUNDO pedido 'pending' idêntico quando a
 * mesma requisição chega de novo (retry de rede, duplo clique no botão de
 * pagar) dentro de uma janela curta — reaproveita o pedido já existente em
 * vez de inserir outro.
 *
 * NÃO é uma garantia atômica. Não existe nenhuma unique constraint
 * apoiando esta checagem hoje (compara colunas comuns: total, frete e o
 * conteúdo dos itens/entrega, tudo em SELECTs separados), então duas
 * requisições verdadeiramente simultâneas ainda podem passar por aqui
 * "ao mesmo tempo" e ambas concluírem que não há nada para reaproveitar,
 * criando dois pedidos. Uma garantia de verdade exigiria uma idempotency
 * key própria com constraint no banco — mudança de schema fora do escopo
 * desta etapa; ver aviso correspondente no relatório final em vez de
 * criada aqui sem confirmação.
 */
async function findReusablePendingOrder(
  supabaseService: SupabaseServiceClient,
  params: {
    delivery: DeliveryDetails;
    shippingService: string | null;
    shippingCostCents: number | null;
    totalCents: number;
    items: ResolvedCheckoutItem[];
  },
): Promise<string | null> {
  const since = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60_000).toISOString();

  let query = supabaseService
    .from("orders")
    .select("id, shipping_address, order_items(product_id, variant_id, quantity, unit_price_cents_snapshot)")
    .eq("status", "pending")
    .eq("payment_status", "pending")
    .eq("total_cents", params.totalCents)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  // .eq(col, null) não vira "IS NULL" no PostgREST — precisa de .is() pra
  // isso. Frete ausente (null) é um valor legítimo a comparar aqui.
  query =
    params.shippingService === null
      ? query.is("shipping_service", null)
      : query.eq("shipping_service", params.shippingService);
  query =
    params.shippingCostCents === null
      ? query.is("shipping_cost_cents", null)
      : query.eq("shipping_cost_cents", params.shippingCostCents);

  const { data: candidates, error } = await query;
  if (error || !candidates) return null;

  const wantedSignature = itemsSignature(
    params.items.map((item) => ({
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price_cents_snapshot: item.unitPriceCents,
    })),
  );

  for (const candidate of candidates) {
    const candidateItems = (candidate.order_items ?? []) as {
      product_id: string | null;
      variant_id: string | null;
      quantity: number;
      unit_price_cents_snapshot: number;
    }[];

    if (itemsSignature(candidateItems) !== wantedSignature) continue;
    if (!deliveryMatches(candidate.shipping_address, params.delivery)) continue;

    return candidate.id as string;
  }

  return null;
}

export async function createPendingCheckoutOrder(
  input: CreatePendingCheckoutOrderInput,
): Promise<CreatePendingCheckoutOrderResult> {
  const { costCents: shippingCostCents, service: shippingService } = validateShipping(
    input.shipping,
  );
  const resolvedItems = await resolveItems(input.items);

  const subtotalCents = resolvedItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const totalCents = subtotalCents + (shippingCostCents ?? 0);

  const supabaseService = getSupabaseServiceClient();

  const reusableOrderId = await findReusablePendingOrder(supabaseService, {
    delivery: input.delivery,
    shippingService,
    shippingCostCents,
    totalCents,
    items: resolvedItems,
  });

  if (reusableOrderId) {
    return { orderId: reusableOrderId, totalCents, subtotalCents, items: resolvedItems };
  }

  const { data: orderRow, error: orderError } = await supabaseService
    .from("orders")
    .insert({
      status: "pending",
      payment_status: "pending",
      customer_name: input.delivery.fullName,
      customer_phone: input.delivery.phone,
      subtotal_cents: subtotalCents,
      total_cents: totalCents,
      shipping_address: input.delivery,
      shipping_cost_cents: shippingCostCents,
      shipping_service: shippingService,
      whatsapp_message: null,
    })
    .select("id")
    .single();

  if (orderError || !orderRow) {
    throw new Error(
      `[lib/payments/checkout-order] Falha ao criar pedido: ${orderError?.message}`,
    );
  }

  const { error: itemsError } = await supabaseService.from("order_items").insert(
    resolvedItems.map((item) => ({
      order_id: orderRow.id,
      product_id: item.productId,
      product_name_snapshot: item.productNameSnapshot,
      unit_price_cents_snapshot: item.unitPriceCents,
      quantity: item.quantity,
      variant_id: item.variantId,
      variant_label_snapshot: item.variantLabelSnapshot,
    })),
  );

  if (itemsError) {
    // Dois inserts separados (não uma RPC transacional, ver comentário do
    // topo) — se os itens falharem, desfaz o pedido órfão manualmente em
    // vez de deixar uma linha em orders sem nenhum order_items
    // correspondente.
    await supabaseService.from("orders").delete().eq("id", orderRow.id);
    throw new Error(
      `[lib/payments/checkout-order] Falha ao gravar itens do pedido: ${itemsError.message}`,
    );
  }

  return { orderId: orderRow.id as string, totalCents, subtotalCents, items: resolvedItems };
}
