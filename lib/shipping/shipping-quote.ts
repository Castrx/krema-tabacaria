import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderRequestItem } from "@/lib/orders";
import { calculateShipment, type ShippingQuoteOption } from "@/lib/shipping/melhor-envio";

// Resolução server-side da cotação de frete: recebe CEP de destino +
// itens do carrinho, busca peso/dimensões/preço ATUAIS dos produtos no
// Supabase (nunca confia no que o client mandaria) e delega o cálculo em
// si para lib/shipping/melhor-envio.ts. Não cria pedido, não altera
// estoque, não grava nada no banco — só consulta.
//
// Empacotamento: não implementamos nenhum algoritmo próprio de "como
// encaixar N produtos numa caixa" — mandamos um item por linha do
// carrinho pro Melhor Envio (products[], com peso/dimensões individuais e
// quantity), e é o cálculo deles que decide o(s) pacote(s) resultante(s).
// Evita ter que inventar uma regra comercial de embalagem que a Krema
// ainda não definiu (ver relatório desta etapa).
//
// Origem fixa: endereço real da Krema (Rua Paulista, 37, Centro, Arroio
// do Sal/RS — CEP 95585-000, o mesmo já usado em
// components/home/Location.tsx). Não é configurável por env de propósito:
// é o endereço físico real da loja, não uma configuração de deploy.

export class ShippingQuoteValidationError extends Error {}

/** CEP de origem — endereço real e confirmado da Krema. Fixo no código,
 * não em env: é dado da loja, não parâmetro de ambiente. */
const ORIGIN_POSTAL_CODE = "95585000";

type ProductForShippingRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  is_active: boolean;
  weight_grams: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
};

type VariantForShippingRow = {
  id: string;
  product_id: string;
  sku: string;
  color: string | null;
  model: string | null;
  price_cents: number | null;
  is_active: boolean;
};

export type ShippingQuoteRequestInput = {
  destinationCep: string;
  items: OrderRequestItem[];
};

export type ShippingQuoteResult = {
  options: ShippingQuoteOption[];
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function variantLabel(variant: VariantForShippingRow | null): string | null {
  if (!variant) return null;
  return [variant.color, variant.model].filter(Boolean).join(" · ") || variant.sku;
}

export async function getShippingQuote(
  input: ShippingQuoteRequestInput,
): Promise<ShippingQuoteResult> {
  const destinationDigits = onlyDigits(input.destinationCep ?? "");
  if (destinationDigits.length !== 8) {
    throw new ShippingQuoteValidationError("CEP de destino inválido — precisa ter 8 dígitos.");
  }

  if (input.items.length === 0) {
    throw new ShippingQuoteValidationError(
      "O carrinho está vazio — nenhuma cotação de frete foi calculada.",
    );
  }
  for (const item of input.items) {
    if (!item.productId) {
      throw new ShippingQuoteValidationError("Item do carrinho sem productId.");
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ShippingQuoteValidationError(
        `Quantidade inválida para "${item.productId}" — precisa ser um inteiro maior que zero.`,
      );
    }
  }

  const slugs = input.items.map((item) => item.productId);
  const variantIds = Array.from(
    new Set(
      input.items.map((item) => item.variantId).filter((id): id is string => Boolean(id)),
    ),
  );

  const supabaseRead = getSupabaseServerClient();

  const { data: productsData, error: productsError } = await supabaseRead
    .from("products")
    .select("id, slug, name, price_cents, is_active, weight_grams, length_cm, width_cm, height_cm")
    .in("slug", slugs);

  if (productsError) {
    throw new Error(
      `[lib/shipping/shipping-quote] Falha ao validar produtos: ${productsError.message}`,
    );
  }

  let variantsData: VariantForShippingRow[] = [];
  if (variantIds.length > 0) {
    const { data, error: variantsError } = await supabaseRead
      .from("product_variants")
      .select("id, product_id, sku, color, model, price_cents, is_active")
      .in("id", variantIds);

    if (variantsError) {
      throw new Error(
        `[lib/shipping/shipping-quote] Falha ao validar variantes: ${variantsError.message}`,
      );
    }
    variantsData = data as VariantForShippingRow[];
  }

  const productsBySlug = new Map(
    (productsData as ProductForShippingRow[]).map((product) => [product.slug, product]),
  );
  const variantsById = new Map(variantsData.map((variant) => [variant.id, variant]));

  const invalidItems: string[] = [];
  const missingDimensions: string[] = [];
  const meProducts: {
    id: string;
    widthCm: number;
    heightCm: number;
    lengthCm: number;
    weightKg: number;
    insuranceValueCents: number;
    quantity: number;
  }[] = [];

  for (const item of input.items) {
    const product = productsBySlug.get(item.productId);
    if (!product || !product.is_active) {
      invalidItems.push(item.productId);
      continue;
    }

    let variant: VariantForShippingRow | null = null;
    if (item.variantId) {
      const found = variantsById.get(item.variantId);
      if (!found || !found.is_active || found.product_id !== product.id) {
        invalidItems.push(`${item.productId} (variante indisponível)`);
        continue;
      }
      variant = found;
    }

    // Peso/dimensões vivem só em products (ver migration
    // *_add_checkout_payment_shipping_columns.sql) — product_variants não
    // tem essas colunas hoje, então uma variante sempre usa o físico do
    // produto pai, mesmo quando tem preço próprio.
    if (
      product.weight_grams === null ||
      product.length_cm === null ||
      product.width_cm === null ||
      product.height_cm === null
    ) {
      const label = variantLabel(variant);
      missingDimensions.push(`${product.name}${label ? ` (${label})` : ""}`);
      continue;
    }

    const unitPriceCents = variant?.price_cents ?? product.price_cents;
    meProducts.push({
      id: variant?.id ?? product.id,
      widthCm: product.width_cm,
      heightCm: product.height_cm,
      lengthCm: product.length_cm,
      weightKg: product.weight_grams / 1000,
      insuranceValueCents: unitPriceCents,
      quantity: item.quantity,
    });
  }

  if (invalidItems.length > 0) {
    throw new ShippingQuoteValidationError(
      `Produto(s)/variante(s) indisponível(is) ou inexistente(s): ${invalidItems.join(", ")}.`,
    );
  }
  if (missingDimensions.length > 0) {
    // Estado ESPERADO hoje: nenhum produto real da Krema tem
    // peso/dimensões cadastrados ainda — este erro é o comportamento
    // correto (recusar cotação real com dado inventado), não um bug.
    throw new ShippingQuoteValidationError(
      `Produto(s) sem peso/dimensões cadastrados — não é possível calcular frete real: ${missingDimensions.join(", ")}.`,
    );
  }

  return calculateShipment({
    from: { postalCode: ORIGIN_POSTAL_CODE },
    to: { postalCode: destinationDigits },
    products: meProducts,
  });
}
