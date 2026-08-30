import { ImageOff } from "lucide-react";

/**
 * Resolve a imagem principal de um produto — mesma regra que já estava
 * duplicada em ProductCard/ProductQuickView/página de produto/CartSheet
 * (`product.images[0] ?? product.image`), só que tratando string vazia
 * como "sem imagem" também (`??` deixava passar `product.image === ""`
 * direto pro <Image src="">, que quebra o next/image).
 *
 * Retorna null quando o produto não tem nenhuma imagem válida — nesse
 * caso, quem chama deve renderizar <ProductImagePlaceholder /> no lugar
 * do <Image>, nunca tentar montar uma src vazia/inválida.
 */
export function resolveProductImageUrl(product: {
  image: string;
  images: string[];
}): string | null {
  return product.images[0] || product.image || null;
}

/**
 * Placeholder visual para produto sem nenhuma imagem cadastrada (ex.:
 * criado no admin antes do upload). Nunca uma foto inventada — só um
 * ícone neutro, consistente com o resto do catálogo.
 *
 * Sem cor de fundo própria de propósito: os quatro lugares que usam isto
 * (ProductCard, ProductQuickView, página de produto, CartSheet) já têm o
 * contêiner da imagem com um fundo escuro (`bg-[#111]`/`bg-[#141414]`) —
 * duplicar o fundo aqui só dessincronizaria as duas cores usadas hoje.
 * `className` decide o preenchimento: `absolute inset-0` nos três lugares
 * que usam `<Image fill>` (o contêiner já é `relative`), `h-full w-full`
 * no CartSheet (miniatura de tamanho fixo, sem `fill`).
 */
export function ProductImagePlaceholder({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <ImageOff className="size-8 text-white/20" aria-hidden="true" />
    </div>
  );
}
