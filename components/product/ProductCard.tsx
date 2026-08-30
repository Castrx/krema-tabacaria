"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "@/types/product";
import { useCart } from "@/components/cart/CartProvider";
import {
  ProductImagePlaceholder,
  resolveProductImageUrl,
} from "@/components/product/ProductImagePlaceholder";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Combina next/image (otimização) com o hover animado do Motion na própria imagem.
const MotionImage = motion.create(Image);

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const productHref = `/produtos/${product.slug}`;

  // Produto com variantes precisa de seleção antes de ir pro carrinho
  // (cor/modelo escolhidos na página do produto ou no Quick View — nunca
  // aqui: o card não vira um seletor de variantes). O atalho "+" deste
  // card pressupõe "adicionar direto", o que só é válido pra produto sem
  // variante; com variante, ele simplesmente não aparece, e a imagem/
  // título (já são <Link>) levam pra página onde dá pra escolher.
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const imageUrl = resolveProductImageUrl(product);

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    // Botão fica sobreposto à área da imagem — nunca deve disparar a
    // navegação do Link por trás dele.
    event.preventDefault();
    event.stopPropagation();
    addItem(product.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#111]">
        <Link
          href={productHref}
          aria-label={`Ver produto completo: ${product.name}`}
          className="absolute inset-0 z-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          {imageUrl ? (
            <MotionImage
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ) : (
            <ProductImagePlaceholder className="absolute inset-0" />
          )}
        </Link>

        {product.priceIsProvisional && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/70 backdrop-blur-md">
            Preço demonstrativo
          </span>
        )}

        {!hasVariants && (
          <motion.button
            type="button"
            onClick={handleAdd}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            whileTap={{ scale: 0.92 }}
            className="absolute bottom-3 right-3 z-10 flex size-10 items-center justify-center rounded-full border border-white/15 bg-white text-black opacity-100 shadow-lg transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          >
            {added ? (
              <Check className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
          </motion.button>
        )}
      </div>

      <Link
        href={productHref}
        className="mt-3 flex flex-col gap-0.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
      >
        {product.brand && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            {product.brand}
          </span>
        )}

        <h3 className="truncate text-sm font-medium text-white md:text-base">
          {product.name}
        </h3>

        <span className="text-sm font-semibold text-white">
          {currencyFormatter.format(product.price)}
        </span>
      </Link>
    </article>
  );
}
