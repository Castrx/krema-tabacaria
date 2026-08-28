export type ProductCategory =
  | "cinzeiros"
  | "dichavadores"
  | "isqueiros"
  | "acessorios"
  | "pipes"
  | "bongs";

/**
 * Uma variante comprável de um produto (ex.: cor/modelo do Firestar Mini
 * Torch). Opcional por natureza — a maioria dos produtos hoje não tem
 * nenhuma. Ver arquitetura aprovada para o modelo completo.
 */
export type ProductVariant = {
  id: string;
  sku: string;
  color?: string;
  model?: string;
  /**
   * Preço efetivo já resolvido (variant.price_cents ?? product.price_cents),
   * em reais — resolvido em lib/products.ts, nunca no cliente.
   */
  price?: number;
  stockQuantity: number;
  isActive: boolean;
  position?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  image: string;
  images: string[];
  /**
   * Preço demonstrativo, usado apenas para a apresentação da V2 ao cliente.
   * NÃO representa o valor real cobrado pela Krema.
   */
  price: number;
  priceIsProvisional: boolean;
  shortDescription: string;
  description: string;
  specs?: string[];
  verified: boolean;
  /**
   * Variantes reais do produto (cor/modelo), quando existirem. Ausente ou
   * vazio = produto sem variante, comprado exatamente como hoje.
   */
  variants?: ProductVariant[];
};
