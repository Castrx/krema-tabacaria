import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

// Camada de dados do admin para produtos — leitura e escrita SEMPRE via
// service role (server-only, nunca importado por Client Components).
//
// Por quê service role e não o client de sessão (anon key)? A policy
// pública de `products` (ver supabase/migrations/*_initial_catalog_schema)
// só permite SELECT de produtos com is_active = true, e não existe (de
// propósito) nenhuma policy de UPDATE para nenhum papel — nem para
// "authenticated". O admin precisa enxergar e alternar também os
// produtos inativos, o que a RLS pública nunca permitiria. Em vez de
// criar uma policy nova (que o escopo desta etapa pede para evitar:
// "nunca criar policy pública para admin"), a autorização fica inteira
// no código: quem chama estas funções é responsável por já ter passado
// por requireAdmin() antes — exatamente como lib/orders.ts já faz para
// a escrita de pedidos.
//
// Autorização (requireAdmin()) é responsabilidade de quem chama —
// Server Actions em app/admin/(protected)/products/actions.ts. Este
// módulo não repete a checagem, só executa a operação já autorizada.

export class ProductValidationError extends Error {}

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  priceCents: number;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
};

/** Produto completo para prefill do formulário de edição. */
export type AdminProductDetail = {
  id: string;
  slug: string;
  name: string;
  brandId: string | null;
  categoryId: string;
  shortDescription: string;
  description: string;
  specs: string[];
  priceCents: number;
  priceIsProvisional: boolean;
  isActive: boolean;
  isFeatured: boolean;
};

/** Opção simples para os <select> de marca/categoria do formulário. */
export type AdminOption = {
  id: string;
  name: string;
};

/**
 * Dados do formulário de criar/editar produto — já no formato "de
 * negócio" (preço em reais, não em centavos; specs como array já
 * separado por linha). A conversão para o formato de coluna do banco
 * (price_cents, specs text[]) acontece dentro de createProduct/updateProduct,
 * nunca no client.
 */
export type ProductInput = {
  name: string;
  slug: string;
  brandId: string | null;
  categoryId: string;
  shortDescription: string;
  description: string;
  specs: string[];
  priceReais: number;
  priceIsProvisional: boolean;
  isFeatured: boolean;
  isActive: boolean;
};

type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number;
  brands: { name: string } | null;
  categories: { name: string } | null;
};

const ADMIN_PRODUCT_SELECT = `
  id,
  slug,
  name,
  price_cents,
  is_active,
  is_featured,
  stock_quantity,
  brands ( name ),
  categories ( name )
`;

function mapRow(row: AdminProductRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brands?.name ?? null,
    category: row.categories?.name ?? "—",
    priceCents: row.price_cents,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    stockQuantity: row.stock_quantity,
  };
}

/** Todos os produtos (ativos e inativos) — só para uso no painel admin. */
export async function getAllProductsForAdmin(): Promise<AdminProduct[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_PRODUCT_SELECT)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao carregar produtos: ${error.message}`,
    );
  }

  return (data as unknown as AdminProductRow[]).map(mapRow);
}

/** Ativa/desativa um produto pelo id. Não altera mais nada (nome, preço,
 * estoque, destaque) — usado pelo botão rápido da listagem. */
export async function setProductActive(
  productId: string,
  isActive: boolean,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao atualizar produto: ${error.message}`,
    );
  }
}

/** Marcas para o <select> do formulário — todas, sem filtro (marcas não
 * têm conceito de ativo/inativo no schema atual). */
export async function getBrandsForAdmin(): Promise<AdminOption[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao carregar marcas: ${error.message}`,
    );
  }

  return data as AdminOption[];
}

/** Categorias para o <select> do formulário. */
export async function getCategoriesForAdmin(): Promise<AdminOption[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao carregar categorias: ${error.message}`,
    );
  }

  return data as AdminOption[];
}

type ProductDetailRow = {
  id: string;
  slug: string;
  name: string;
  brand_id: string | null;
  category_id: string;
  short_description: string;
  description: string;
  specs: string[] | null;
  price_cents: number;
  price_is_provisional: boolean;
  is_active: boolean;
  is_featured: boolean;
};

const PRODUCT_DETAIL_SELECT = `
  id,
  slug,
  name,
  brand_id,
  category_id,
  short_description,
  description,
  specs,
  price_cents,
  price_is_provisional,
  is_active,
  is_featured
`;

function mapDetailRow(row: ProductDetailRow): AdminProductDetail {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandId: row.brand_id,
    categoryId: row.category_id,
    shortDescription: row.short_description,
    description: row.description,
    specs: row.specs ?? [],
    priceCents: row.price_cents,
    priceIsProvisional: row.price_is_provisional,
    isActive: row.is_active,
    isFeatured: row.is_featured,
  };
}

/** Produto completo (todos os campos editáveis) para prefill do
 * formulário de edição — null se o id não existir. */
export async function getProductForEdit(
  productId: string,
): Promise<AdminProductDetail | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_DETAIL_SELECT)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao carregar produto: ${error.message}`,
    );
  }

  return data ? mapDetailRow(data as ProductDetailRow) : null;
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Valida os campos do formulário e devolve o payload já pronto para
 * gravar no banco (price_cents calculado, specs limpo). Lança
 * ProductValidationError com mensagem amigável em qualquer campo
 * inválido — nunca deixa passar dado inconsistente para o insert/update.
 */
function validateProductInput(input: ProductInput) {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const shortDescription = input.shortDescription.trim();
  const description = input.description.trim();
  const specs = input.specs.map((line) => line.trim()).filter(Boolean);

  if (!name) {
    throw new ProductValidationError("Informe o nome do produto.");
  }
  if (!slug) {
    throw new ProductValidationError("Informe o slug do produto.");
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new ProductValidationError(
      'Slug inválido — use apenas letras minúsculas, números e hífen (ex.: "cinzeiro-quadrado-squadafum").',
    );
  }
  if (!input.categoryId) {
    throw new ProductValidationError("Selecione uma categoria.");
  }
  if (!shortDescription) {
    throw new ProductValidationError("Informe a descrição curta.");
  }
  if (!description) {
    throw new ProductValidationError("Informe a descrição completa.");
  }
  if (!Number.isFinite(input.priceReais) || input.priceReais <= 0) {
    throw new ProductValidationError(
      "Informe um preço válido, maior que zero.",
    );
  }

  const priceCents = Math.round(input.priceReais * 100);

  return {
    name,
    slug,
    brand_id: input.brandId || null,
    category_id: input.categoryId,
    short_description: shortDescription,
    description,
    specs,
    price_cents: priceCents,
    price_is_provisional: input.priceIsProvisional,
    is_featured: input.isFeatured,
    is_active: input.isActive,
  };
}

async function assertSlugAvailable(
  slug: string,
  excludeProductId?: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from("products").select("id").eq("slug", slug);
  if (excludeProductId) {
    query = query.neq("id", excludeProductId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao verificar slug: ${error.message}`,
    );
  }
  if (data) {
    throw new ProductValidationError(
      `Já existe um produto com o slug "${slug}".`,
    );
  }
}

/** Código do Postgres para violação de constraint UNIQUE — segunda linha
 * de defesa contra corrida de duas criações simultâneas com o mesmo
 * slug (a checagem em assertSlugAvailable já cobre o caso comum, mas não
 * é atômica sozinha). */
const POSTGRES_UNIQUE_VIOLATION = "23505";

export async function createProduct(input: ProductInput): Promise<string> {
  const payload = validateProductInput(input);
  await assertSlugAvailable(payload.slug);

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      throw new ProductValidationError(
        `Já existe um produto com o slug "${payload.slug}".`,
      );
    }
    throw new Error(
      `[lib/admin/products] Falha ao criar produto: ${error.message}`,
    );
  }

  return (data as { id: string }).id;
}

export async function updateProduct(
  productId: string,
  input: ProductInput,
): Promise<void> {
  const payload = validateProductInput(input);
  await assertSlugAvailable(payload.slug, productId);

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId);

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      throw new ProductValidationError(
        `Já existe um produto com o slug "${payload.slug}".`,
      );
    }
    throw new Error(
      `[lib/admin/products] Falha ao salvar produto: ${error.message}`,
    );
  }
}

// =============================================================================
// Variantes (product_variants) — tabela já existe no Supabase (ver
// supabase/migrations/*_create_product_variants.sql). Nenhuma migration
// nova nesta etapa: só a camada de admin para gerenciar as linhas.
//
// Mesmo padrão de autorização/acesso do resto deste módulo: sempre
// service role, autorização (requireAdmin()) é responsabilidade de quem
// chama (Server Actions em app/admin/(protected)/products/*).
// =============================================================================

export type AdminVariant = {
  id: string;
  productId: string;
  sku: string;
  color: string | null;
  model: string | null;
  /** null = herda o preço do produto — nunca resolvido aqui, só exibido
   * como "herda" no admin. A resolução para o preço efetivo de venda
   * acontece em lib/products.ts (mapVariantRow), no caminho público. */
  priceCents: number | null;
  stockQuantity: number;
  isActive: boolean;
  position: number | null;
};

/**
 * Dados do formulário de criar/editar variante — preço em reais (string
 * vazia = herda do produto), já no formato "de negócio". A conversão
 * para price_cents (ou null) acontece dentro de createVariant/updateVariant.
 */
export type VariantInput = {
  sku: string;
  color: string;
  model: string;
  priceReais: string;
  stockQuantity: number;
  isActive: boolean;
  position: number | null;
};

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  color: string | null;
  model: string | null;
  price_cents: number | null;
  stock_quantity: number;
  is_active: boolean;
  position: number | null;
};

const VARIANT_SELECT = `
  id,
  product_id,
  sku,
  color,
  model,
  price_cents,
  stock_quantity,
  is_active,
  position
`;

function mapVariantRow(row: VariantRow): AdminVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    color: row.color,
    model: row.model,
    priceCents: row.price_cents,
    stockQuantity: row.stock_quantity,
    isActive: row.is_active,
    position: row.position,
  };
}

/** Todas as variantes de um produto (ativas e inativas), para a seção
 * "Variantes" da tela de edição. Ordenadas por position (nulls por
 * último) e, dentro do empate, por criação. */
export async function getVariantsForProduct(
  productId: string,
): Promise<AdminVariant[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(VARIANT_SELECT)
    .eq("product_id", productId)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao carregar variantes: ${error.message}`,
    );
  }

  return (data as VariantRow[]).map(mapVariantRow);
}

/**
 * Valida os campos do formulário de variante e devolve o payload pronto
 * para insert/update. Lança ProductValidationError (mesma classe do
 * produto — é o mesmo tipo de erro de validação de formulário do admin)
 * com mensagem amigável em qualquer campo inválido.
 */
function validateVariantInput(input: VariantInput) {
  const sku = input.sku.trim();
  const color = input.color.trim();
  const model = input.model.trim();

  if (!sku) {
    throw new ProductValidationError("Informe o SKU da variante.");
  }
  if (!color && !model) {
    throw new ProductValidationError(
      "Informe cor e/ou modelo — uma variante precisa de ao menos um dos dois para ser identificável.",
    );
  }
  if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) {
    throw new ProductValidationError(
      "Estoque inválido — precisa ser um número inteiro maior ou igual a zero.",
    );
  }

  let priceCents: number | null = null;
  const priceTrimmed = input.priceReais.trim();
  if (priceTrimmed) {
    const priceReais = Number(priceTrimmed.replace(",", "."));
    if (!Number.isFinite(priceReais) || priceReais <= 0) {
      throw new ProductValidationError(
        "Preço da variante inválido — deixe em branco para herdar o preço do produto, ou informe um valor maior que zero.",
      );
    }
    priceCents = Math.round(priceReais * 100);
  }

  const position =
    input.position !== null && Number.isInteger(input.position)
      ? input.position
      : null;

  return {
    sku,
    color: color || null,
    model: model || null,
    price_cents: priceCents,
    stock_quantity: input.stockQuantity,
    is_active: input.isActive,
    position,
  };
}

async function assertSkuAvailable(
  sku: string,
  excludeVariantId?: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from("product_variants").select("id").eq("sku", sku);
  if (excludeVariantId) {
    query = query.neq("id", excludeVariantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao verificar SKU: ${error.message}`,
    );
  }
  if (data) {
    throw new ProductValidationError(`Já existe uma variante com o SKU "${sku}".`);
  }
}

async function assertColorModelAvailable(
  productId: string,
  color: string | null,
  model: string | null,
  excludeVariantId?: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  // .eq() com null não funciona no PostgREST (viraria "= null", sempre
  // falso) — precisa de .is() para comparar com NULL corretamente.
  let query = supabase
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);
  query = color === null ? query.is("color", null) : query.eq("color", color);
  query = model === null ? query.is("model", null) : query.eq("model", model);
  if (excludeVariantId) {
    query = query.neq("id", excludeVariantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao verificar cor/modelo: ${error.message}`,
    );
  }
  if (data) {
    throw new ProductValidationError(
      "Já existe uma variante com essa combinação de cor e modelo para este produto.",
    );
  }
}

export async function createVariant(
  productId: string,
  input: VariantInput,
): Promise<void> {
  const payload = validateVariantInput(input);
  await assertSkuAvailable(payload.sku);
  await assertColorModelAvailable(productId, payload.color, payload.model);

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("product_variants")
    .insert({ ...payload, product_id: productId });

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      throw new ProductValidationError(
        "SKU já em uso, ou já existe uma variante com essa cor/modelo para este produto.",
      );
    }
    throw new Error(
      `[lib/admin/products] Falha ao criar variante: ${error.message}`,
    );
  }
}

export async function updateVariant(
  variantId: string,
  productId: string,
  input: VariantInput,
): Promise<void> {
  const payload = validateVariantInput(input);
  await assertSkuAvailable(payload.sku, variantId);
  await assertColorModelAvailable(productId, payload.color, payload.model, variantId);

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("product_variants")
    .update(payload)
    .eq("id", variantId);

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      throw new ProductValidationError(
        "SKU já em uso, ou já existe uma variante com essa cor/modelo para este produto.",
      );
    }
    throw new Error(
      `[lib/admin/products] Falha ao salvar variante: ${error.message}`,
    );
  }
}

/** Ativa/desativa uma variante pelo id — usado pelo botão rápido da
 * lista de variantes. */
export async function setVariantActive(
  variantId: string,
  isActive: boolean,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("product_variants")
    .update({ is_active: isActive })
    .eq("id", variantId);

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao atualizar variante: ${error.message}`,
    );
  }
}

/** Remove definitivamente uma variante. Diferente de produtos (que nunca
 * são apagados nesta fase), variantes podem — pedido explicitamente no
 * escopo desta etapa. order_items.variant_id referencia esta tabela com
 * ON DELETE SET NULL, então pedidos antigos que usaram a variante
 * preservam o histórico via variant_label_snapshot mesmo depois dela
 * ser removida. */
export async function deleteVariant(variantId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId);

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao remover variante: ${error.message}`,
    );
  }
}

// =============================================================================
// Imagens (product_images) — tabela já existe no Supabase. Nenhuma
// migration nova nesta etapa: só visualizar, reordenar e remover as
// linhas já cadastradas. Upload continua fora de escopo (nada de
// Supabase Storage ainda) — o campo `images` no modelo público
// (types/product.ts / lib/products.ts) não é tocado, só a leitura/escrita
// administrativa aqui.
//
// Mesmo padrão de autorização do resto do módulo: sempre service role,
// requireAdmin() é responsabilidade de quem chama (Server Actions em
// app/admin/(protected)/products/imageActions.ts).
// =============================================================================

export type AdminProductImage = {
  id: string;
  url: string;
  position: number;
  altText: string | null;
};

type ProductImageRow = {
  id: string;
  url: string;
  position: number;
  alt_text: string | null;
};

/** Todas as imagens de um produto, ordenadas pela posição atual
 * (0 = principal). */
export async function getImagesForProduct(
  productId: string,
): Promise<AdminProductImage[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, position, alt_text")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao carregar imagens: ${error.message}`,
    );
  }

  return (data as ProductImageRow[]).map((row) => ({
    id: row.id,
    url: row.url,
    position: row.position,
    altText: row.alt_text,
  }));
}

/**
 * Reatribui position = 0..N-1 às imagens de um produto, na ordem exata
 * de `orderedIds`. Em duas fases, porque UNIQUE(product_id, position) no
 * banco rejeitaria um UPDATE que tentasse usar uma posição que outra
 * linha do mesmo produto ainda ocupa: primeiro empurra todas as posições
 * atuais para valores negativos — nunca colidem entre si (posições
 * atuais já eram únicas, então -(pos+1) também são) nem com os valores
 * finais (sempre >= 0) — só depois grava os valores finais. Nunca existe
 * um instante em que duas linhas do mesmo produto dividem a mesma
 * position.
 *
 * Negativo, não um deslocamento positivo grande (ex.: +100000): a coluna
 * é `smallint` no Postgres (intervalo -32768..32767) — um offset fixo
 * "bem alto" pode facilmente estourar esse limite. Um valor negativo
 * pequeno nunca estoura, não importa quantas imagens o produto tenha.
 *
 * `currentImages` precisa refletir a position ATUAL (antes desta chamada)
 * de cada imagem em `orderedIds` — usada só para a fase 1.
 */
async function renumberProductImages(
  supabase: SupabaseClient,
  currentImages: { id: string; position: number }[],
  orderedIds: string[],
): Promise<void> {
  for (const image of currentImages) {
    const { error } = await supabase
      .from("product_images")
      .update({ position: -(image.position + 1) })
      .eq("id", image.id);

    if (error) {
      throw new Error(
        `[lib/admin/products] Falha ao reordenar imagens (fase 1): ${error.message}`,
      );
    }
  }

  for (let index = 0; index < orderedIds.length; index++) {
    const { error } = await supabase
      .from("product_images")
      .update({ position: index })
      .eq("id", orderedIds[index]);

    if (error) {
      throw new Error(
        `[lib/admin/products] Falha ao reordenar imagens (fase 2): ${error.message}`,
      );
    }
  }
}

/** Confere que o produto existe — mesma checagem usada tanto por
 * setImagePosition quanto por deleteProductImage, para rejeitar de
 * forma clara uma chamada com productId inexistente. */
async function assertProductExists(
  supabase: SupabaseClient,
  productId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao verificar produto: ${error.message}`,
    );
  }
  if (!data) {
    throw new ProductValidationError("Produto não encontrado.");
  }
}

/**
 * Move uma imagem para a posição pedida. Nunca deixa duplicidade nem
 * buraco: remove a imagem da lista atual, insere na posição pedida
 * (limitada ao intervalo válido) e renumera 0..N-1 a partir daí — ou
 * seja, qualquer conflito (duas imagens "pedindo" a mesma posição) é
 * resolvido deslocando as outras, nunca rejeitado nem sobrescrito às
 * cegas.
 */
export async function setImagePosition(
  productId: string,
  imageId: string,
  requestedPosition: number,
): Promise<void> {
  if (!Number.isInteger(requestedPosition) || requestedPosition < 0) {
    throw new ProductValidationError(
      "Posição inválida — precisa ser um número inteiro maior ou igual a zero.",
    );
  }

  const supabase = getSupabaseServiceClient();
  await assertProductExists(supabase, productId);

  const { data, error } = await supabase
    .from("product_images")
    .select("id, position")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao carregar imagens: ${error.message}`,
    );
  }

  const currentImages = data as { id: string; position: number }[];
  const currentIds = currentImages.map((image) => image.id);

  if (!currentIds.includes(imageId)) {
    throw new ProductValidationError(
      "Imagem não encontrada para este produto.",
    );
  }

  const withoutMoved = currentIds.filter((id) => id !== imageId);
  const clampedIndex = Math.min(requestedPosition, withoutMoved.length);
  const reordered = [
    ...withoutMoved.slice(0, clampedIndex),
    imageId,
    ...withoutMoved.slice(clampedIndex),
  ];

  await renumberProductImages(supabase, currentImages, reordered);
}

/**
 * Remove uma imagem e fecha o buraco deixado na numeração — sem isso,
 * apagar a imagem do meio de [0, 1, 2] deixaria [0, 2] em vez de [0, 1],
 * quebrando a garantia de "position=0 é sempre a principal, sem buracos
 * nem duplicidade" pro resto do admin.
 */
export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  await assertProductExists(supabase, productId);

  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, position")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(
      `[lib/admin/products] Falha ao carregar imagens: ${error.message}`,
    );
  }

  const currentImages = data as { id: string; url: string; position: number }[];
  const target = currentImages.find((image) => image.id === imageId);
  if (!target) {
    throw new ProductValidationError(
      "Imagem não encontrada para este produto.",
    );
  }

  // Só tenta apagar do Storage quando a URL é realmente deste bucket —
  // imagens seed antigas (servidas de /public) nunca foram upload real,
  // "apagar" delas do Storage não faz sentido (e não deve gerar erro).
  const objectPath = extractStorageObjectPath(target.url);
  if (objectPath) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([objectPath]);
    if (storageError) {
      // Não bloqueia a remoção do registro por causa disso — o mais
      // visível pro admin é a imagem sumir da lista; um objeto órfão no
      // Storage é recuperável depois, um registro que não some não é.
      console.error(
        `[lib/admin/products] Falha ao remover objeto do Storage (${objectPath}): ${storageError.message}`,
      );
    }
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (deleteError) {
    throw new Error(
      `[lib/admin/products] Falha ao remover imagem: ${deleteError.message}`,
    );
  }

  const remainingImages = currentImages.filter((image) => image.id !== imageId);
  if (remainingImages.length > 0) {
    await renumberProductImages(
      supabase,
      remainingImages,
      remainingImages.map((image) => image.id),
    );
  }
}

// =============================================================================
// Upload (Supabase Storage, bucket "product-images" — ver
// supabase/migrations/*_create_product_images_storage.sql para o bucket
// e a policy de leitura pública). Upload/remoção só pelo service role,
// sempre atrás de requireAdmin() (Server Action em
// app/admin/(protected)/products/imageActions.ts). Sem compressão/edição
// automática nesta etapa: o arquivo é gravado como veio, só
// validado (tipo/tamanho) e renomeado — nunca usa o nome original.
// =============================================================================

const PRODUCT_IMAGES_BUCKET = "product-images";

/** Mesmo valor do file_size_limit configurado no bucket (ver migration)
 * — validado aqui também para devolver uma mensagem amigável em vez de
 * deixar o Storage rejeitar com um erro genérico. */
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Extensão derivada do MIME type já validado — nunca do nome do
 * arquivo enviado pelo admin. */
const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
  "image/avif": "avif",
};

function storagePublicUrlPrefix(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "[lib/admin/products] NEXT_PUBLIC_SUPABASE_URL não configurada.",
    );
  }
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
}

/** Extrai o path do objeto no bucket a partir da URL pública salva em
 * product_images.url — null quando a URL não é deste bucket (as imagens
 * seed originais, servidas de /public, nunca foram upload real). */
function extractStorageObjectPath(url: string): string | null {
  const prefix = storagePublicUrlPrefix();
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

/**
 * Envia um arquivo para o bucket product-images e cria o registro
 * correspondente em product_images.
 *
 * Posição automática: produto sem nenhuma imagem ainda → position=0;
 * caso contrário, agrega no fim (maior position atual + 1) — nunca
 * reaproveita uma position já usada, então nunca gera duplicidade.
 */
export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<AdminProductImage> {
  const extension = ALLOWED_IMAGE_EXTENSIONS[file.type];
  if (!extension) {
    throw new ProductValidationError(
      "Formato de imagem não suportado — envie PNG, JPEG, WebP ou AVIF.",
    );
  }
  if (file.size <= 0) {
    throw new ProductValidationError("Arquivo vazio.");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ProductValidationError(
      `Arquivo muito grande — o limite é ${Math.round(MAX_IMAGE_SIZE_BYTES / 1024 / 1024)}MB.`,
    );
  }

  const supabase = getSupabaseServiceClient();
  await assertProductExists(supabase, productId);

  const { data: lastImage, error: lastImageError } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1);

  if (lastImageError) {
    throw new Error(
      `[lib/admin/products] Falha ao verificar imagens existentes: ${lastImageError.message}`,
    );
  }

  const nextPosition = lastImage.length > 0 ? lastImage[0].position + 1 : 0;

  // Nome nunca depende do original enviado pelo admin — sempre um uuid
  // gerado aqui, extensão derivada do MIME type já validado acima.
  const objectPath = `products/${productId}/${randomUUID()}.${extension}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `[lib/admin/products] Falha ao enviar imagem para o Storage: ${uploadError.message}`,
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(objectPath);

  const { data: inserted, error: insertError } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url: publicUrl, position: nextPosition })
    .select("id, url, position, alt_text")
    .single();

  if (insertError) {
    // Não deixa o arquivo órfão no Storage se o insert falhar (ex.:
    // corrida rara entre dois uploads simultâneos do mesmo produto
    // calculando a mesma nextPosition, violando o UNIQUE(product_id,
    // position)).
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([objectPath]);
    throw new Error(
      `[lib/admin/products] Falha ao registrar imagem: ${insertError.message}`,
    );
  }

  const row = inserted as ProductImageRow;
  return {
    id: row.id,
    url: row.url,
    position: row.position,
    altText: row.alt_text,
  };
}
