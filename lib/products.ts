import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, ProductCategory, ProductVariant } from "@/types/product";

// Camada de acesso ao catálogo via Supabase. Devolve o MESMO formato
// `Product` já usado pelo frontend (types/product.ts).
//
// Só leitura pública (anon key + RLS). Server Components chamam estas
// funções diretamente (ex.: app/produtos/page.tsx); Client Components nunca
// chamam — passam por app/api/products/route.ts, que usa as funções abaixo
// no servidor.

// -----------------------------------------------------------------------------
// Tipos das linhas cruas devolvidas pelo Supabase.
//
// O projeto ainda não gera tipos a partir do schema (`supabase gen types`),
// então estes tipos descrevem manualmente o formato esperado das colunas e
// relacionamentos selecionados abaixo — não são tipos genéricos do banco.
// -----------------------------------------------------------------------------
type ProductImageRow = {
  url: string;
  position: number;
};

// Formato de uma linha de product_variants — embutida em PRODUCT_SELECT
// abaixo. A RLS pública de product_variants (ver
// supabase/migrations/*_create_product_variants.sql) já restringe o que
// a anon key enxerga a variantes ativas de produtos ativos, então o que
// chega aqui nunca precisa ser refiltrado por is_active no código.
type ProductVariantRow = {
  id: string;
  sku: string;
  color: string | null;
  model: string | null;
  price_cents: number | null;
  stock_quantity: number;
  is_active: boolean;
  position: number | null;
};

type ProductRow = {
  slug: string;
  name: string;
  short_description: string;
  description: string;
  specs: string[] | null;
  price_cents: number;
  price_is_provisional: boolean;
  // Buscado desde já para preparar o terreno para controle de estoque, mas
  // ainda NÃO exposto no tipo `Product` (definido em types/product.ts, fora
  // do escopo desta mudança) nem usado para bloquear compra. Nenhum
  // decremento é feito nesta etapa.
  stock_quantity: number;
  is_featured: boolean;
  verified: boolean;
  brands: { name: string } | null;
  categories: { slug: string } | null;
  product_images: ProductImageRow[] | null;
  // null/vazio = produto sem variante, comprado exatamente como antes
  // desta relação existir — mapRowToProduct trata os dois casos como
  // equivalentes (variants: undefined).
  product_variants: ProductVariantRow[] | null;
};

// category_id é NOT NULL no schema, então o join com categories nunca perde
// linha — "!inner" também é o que permite filtrar por categories.slug em
// getProductsByCategory, então é usado em todas as consultas por consistência.
//
// product_variants: mesma forma de product_images, relação 1:N por
// product_id. Não precisa de "!inner" — produto sem nenhuma variante
// continua retornando a linha do produto normalmente, só com array vazio.
const PRODUCT_SELECT = `
  slug,
  name,
  short_description,
  description,
  specs,
  price_cents,
  price_is_provisional,
  stock_quantity,
  is_featured,
  verified,
  brands ( name ),
  categories!inner ( slug ),
  product_images ( url, position ),
  product_variants ( id, sku, color, model, price_cents, stock_quantity, is_active, position )
`;

function assertNoQueryError(
  error: { message: string } | null,
  context: string,
): void {
  if (error) {
    throw new Error(`[lib/products] Falha ao ${context}: ${error.message}`);
  }
}

/**
 * Converte uma linha crua de product_variants para ProductVariant.
 *
 * Preço efetivo = variant.price_cents ?? product.price_cents (a variante
 * herda o preço do produto-pai quando não tem preço próprio) — resolvido
 * aqui, uma única vez, no servidor. Nenhum componente do cliente resolve
 * preço/estoque de variante por conta própria.
 */
function mapVariantRow(
  row: ProductVariantRow,
  productPriceCents: number,
): ProductVariant {
  return {
    id: row.id,
    sku: row.sku,
    color: row.color ?? undefined,
    model: row.model ?? undefined,
    price: (row.price_cents ?? productPriceCents) / 100,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    position: row.position ?? undefined,
  };
}

/**
 * Converte uma linha crua do Supabase para o Product usado pelo frontend.
 * A conversão price_cents → price (reais) acontece só aqui — centralizada,
 * nenhum componente precisa fazer essa conta.
 */
function mapRowToProduct(row: ProductRow): Product {
  if (!row.categories) {
    // Não deveria acontecer (category_id é NOT NULL) — trata como erro de
    // dado inconsistente em vez de inventar uma categoria.
    throw new Error(
      `[lib/products] Produto "${row.slug}" retornou sem categoria — dado inconsistente no banco.`,
    );
  }

  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((image) => image.url);

  // undefined quando o produto não tem nenhuma variante (array vazio ou
  // null) — produto sem variante continua exatamente como antes desta
  // relação existir.
  const variants = row.product_variants?.length
    ? [...row.product_variants]
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((variantRow) => mapVariantRow(variantRow, row.price_cents))
    : undefined;

  return {
    // Mesmo slug usado como id, exatamente como no antigo data/products.ts —
    // mantém compatibilidade com quem usa product.id como chave (carrinho).
    id: row.slug,
    slug: row.slug,
    name: row.name,
    brand: row.brands?.name,
    category: row.categories.slug as ProductCategory,
    image: images[0] ?? "",
    images,
    price: row.price_cents / 100,
    priceIsProvisional: row.price_is_provisional,
    shortDescription: row.short_description,
    description: row.description,
    specs: row.specs ?? undefined,
    verified: row.verified,
    variants,
  };
}

/**
 * Todos os produtos ativos (RLS já restringe a is_active = true para a anon
 * key — não repetimos esse filtro aqui para não duplicar a mesma regra em
 * dois lugares).
 */
export const getAllProducts = cache(async (): Promise<Product[]> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: true });

  assertNoQueryError(error, "carregar todos os produtos");

  return (data as unknown as ProductRow[]).map(mapRowToProduct);
});

/**
 * Só os slugs de todos os produtos ativos — usado por generateStaticParams()
 * em app/produtos/[slug]/page.tsx, que não precisa do produto completo (com
 * join de marca/categoria/imagens), só da lista de rotas a pré-gerar.
 */
export const getAllProductSlugs = cache(async (): Promise<string[]> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("slug");

  assertNoQueryError(error, "carregar os slugs dos produtos");

  return (data as unknown as { slug: string }[]).map((row) => row.slug);
});

/**
 * Um produto pelo slug, ou null se não existir (ou não estiver ativo, via
 * RLS). Contrato pensado para `if (!product) notFound()` no consumidor.
 */
export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .maybeSingle();

    assertNoQueryError(error, `carregar o produto de slug "${slug}"`);

    return data ? mapRowToProduct(data as unknown as ProductRow) : null;
  },
);

/** Produtos com is_featured = true (substitui o array hardcoded que hoje
 * vive em FeaturedProducts.tsx, quando esse componente for migrado). */
export const getFeaturedProducts = cache(async (): Promise<Product[]> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_featured", true)
    .order("created_at", { ascending: true });

  assertNoQueryError(error, "carregar os produtos em destaque");

  return (data as unknown as ProductRow[]).map(mapRowToProduct);
});

/** Produtos de uma categoria, filtrando pelo slug da categoria relacionada
 * (não pelo category_id, que o chamador não tem). */
export const getProductsByCategory = cache(
  async (categorySlug: string): Promise<Product[]> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("categories.slug", categorySlug)
      .order("created_at", { ascending: true });

    assertNoQueryError(
      error,
      `carregar produtos da categoria "${categorySlug}"`,
    );

    return (data as unknown as ProductRow[]).map(mapRowToProduct);
  },
);

/**
 * Busca em lote por id (= slug). Pensada para o carrinho: hoje o
 * CartProvider guarda só `{productId, quantity}[]`, e essa função resolve
 * esses ids para produtos completos de uma vez, sem N consultas.
 *
 * Preserva a ordem de `ids` no retorno (ex.: ordem dos itens no carrinho) e
 * omite ids que não correspondem a nenhum produto — mesmo comportamento que
 * `products.find()` já tem hoje quando um item do carrinho não é
 * encontrado (CartSheet.tsx: `if (!product) return null`). Isso não é
 * erro de consulta escondido: a consulta em si é validada normalmente por
 * assertNoQueryError; é só um id sem correspondência dentro do lote.
 */
export const getProductsByIds = cache(
  async (ids: string[]): Promise<Product[]> => {
    if (ids.length === 0) return [];

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("slug", ids);

    assertNoQueryError(error, "carregar produtos por id");

    const products = (data as unknown as ProductRow[]).map(mapRowToProduct);
    const productsBySlug = new Map(
      products.map((product) => [product.id, product]),
    );

    return ids
      .map((id) => productsBySlug.get(id))
      .filter((product): product is Product => Boolean(product));
  },
);
