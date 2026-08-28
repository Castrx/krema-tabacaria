"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product, ProductVariant } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function variantLabel(variant: ProductVariant): string {
  return [variant.color, variant.model].filter(Boolean).join(" · ") || variant.sku;
}

/**
 * Controle de quantidade + botão "Adicionar ao carrinho" da página de
 * produto. Extraído como componente próprio (em vez de reaproveitar o
 * ProductQuickView) porque essa parte é a única que precisa de estado de
 * cliente/carrinho nesta página, que é um Server Component.
 *
 * Quando o produto tem variantes (product.variants, já resolvidas e
 * filtradas a variantes ativas server-side em lib/products.ts — nunca
 * refiltradas aqui), exige seleção antes de liberar o botão. Preço e
 * estoque exibidos vêm sempre do que o servidor já resolveu
 * (variant.price já é variant.price_cents ?? product.price_cents,
 * calculado em lib/products.ts) — nunca recalculados no client.
 *
 * addItem(productId, variantId, quantity) recebe a variante selecionada
 * — CartProvider mantém Azul e Vermelho como linhas separadas do
 * carrinho mesmo sendo o mesmo produto (ver isSameLine em
 * CartProvider.tsx).
 */
export function ProductAddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null,
  );

  const selectedVariant = hasVariants
    ? (variants.find((v) => v.id === selectedVariantId) ?? null)
    : null;

  const effectivePrice = selectedVariant?.price ?? product.price;
  const isSoldOut = selectedVariant !== null && selectedVariant.stockQuantity === 0;
  const canAdd = !hasVariants || (selectedVariant !== null && !isSoldOut);

  const handleAdd = () => {
    if (!canAdd) return;
    addItem(product.id, selectedVariant?.id, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  let buttonLabel = "Adicionar ao carrinho";
  if (added) {
    buttonLabel = "Adicionado";
  } else if (hasVariants && !selectedVariant) {
    buttonLabel = "Selecione uma opção";
  } else if (isSoldOut) {
    buttonLabel = "Esgotado";
  }

  return (
    <div className="flex flex-col gap-4">
      {hasVariants && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
            Cor / modelo
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const soldOut = variant.stockQuantity === 0;
              const selected = variant.id === selectedVariantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => setSelectedVariantId(variant.id)}
                  aria-pressed={selected}
                  className={
                    soldOut
                      ? "cursor-not-allowed rounded-full border border-white/5 px-3.5 py-1.5 text-xs text-white/25"
                      : selected
                        ? "rounded-full border border-white bg-white px-3.5 py-1.5 text-xs font-medium text-black transition"
                        : "rounded-full border border-white/15 px-3.5 py-1.5 text-xs text-white/70 transition hover:border-white/40 hover:text-white"
                  }
                >
                  {variantLabel(variant)}
                  {soldOut && " · Esgotado"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-2xl font-semibold text-white">
        {currencyFormatter.format(effectivePrice)}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 px-2 py-1.5">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Diminuir quantidade"
            className="flex size-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Minus className="size-4" />
          </button>

          <span className="w-5 text-center text-sm text-white">{quantity}</span>

          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Aumentar quantidade"
            className="flex size-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added && <Check className="size-4" />}
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
