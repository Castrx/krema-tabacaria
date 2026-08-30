"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Minus, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/components/cart/CartProvider";
import {
  ProductImagePlaceholder,
  resolveProductImageUrl,
} from "@/components/product/ProductImagePlaceholder";
import type { Product, ProductVariant } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function variantLabel(variant: ProductVariant): string {
  return [variant.color, variant.model].filter(Boolean).join(" · ") || variant.sku;
}

export function ProductQuickView({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const imageUrl = resolveProductImageUrl(product);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null,
  );

  const selectedVariant = hasVariants
    ? (variants.find((v) => v.id === selectedVariantId) ?? null)
    : null;

  const effectivePrice = selectedVariant?.price ?? product.price;
  const isSoldOut = selectedVariant !== null && selectedVariant.stockQuantity === 0;
  const canAdd = !hasVariants || (selectedVariant !== null && !isSoldOut);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuantity(1);
      setSelectedVariantId(variants.length === 1 ? variants[0].id : null);
    }
  };

  // addItem(productId, variantId, quantity) preserva a variante
  // selecionada — mesma linha de carrinho só se junta se for o mesmo
  // produto E a mesma variante (ver isSameLine em CartProvider.tsx).
  const handleAdd = () => {
    if (!canAdd) return;
    addItem(product.id, selectedVariant?.id, quantity);
    handleOpenChange(false);
  };

  // Fecha o Quick View ao navegar para a página completa do produto.
  const handleViewFullProduct = () => {
    handleOpenChange(false);
  };

  let buttonLabel = "Adicionar ao carrinho";
  if (hasVariants && !selectedVariant) {
    buttonLabel = "Selecione uma opção";
  } else if (isSoldOut) {
    buttonLabel = "Esgotado";
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="border-white/10 bg-[#0b0b0b] text-white"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-white/10">
          <SheetTitle className="text-white">Detalhes do produto</SheetTitle>

          <SheetClose
            aria-label="Fechar"
            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#141414]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                sizes="384px"
                className="object-cover"
              />
            ) : (
              <ProductImagePlaceholder className="absolute inset-0" />
            )}

            {product.priceIsProvisional && (
              <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/70 backdrop-blur-md">
                Preço demonstrativo
              </span>
            )}
          </div>

          <div className="mt-5 pb-2">
            {product.brand && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                {product.brand}
              </span>
            )}

            <h2 className="mt-1 text-xl font-semibold text-white">
              {product.name}
            </h2>

            <Link
              href={`/produtos/${product.slug}`}
              onClick={handleViewFullProduct}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-white/40 transition hover:text-white/70"
            >
              Ver produto completo
              <ArrowUpRight className="size-3" />
            </Link>

            <p className="mt-3 text-lg font-semibold text-white">
              {currencyFormatter.format(effectivePrice)}
            </p>

            <p className="mt-4 text-sm leading-6 text-white/60">
              {product.shortDescription}
            </p>

            {hasVariants && (
              <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
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
                            ? "cursor-not-allowed rounded-full border border-white/5 px-3 py-1.5 text-xs text-white/25"
                            : selected
                              ? "rounded-full border border-white bg-white px-3 py-1.5 text-xs font-medium text-black transition"
                              : "rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/40 hover:text-white"
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

            {product.specs && product.specs.length > 0 && (
              <ul className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4">
                {product.specs.map((spec) => (
                  <li
                    key={spec}
                    className="flex items-start gap-2 text-sm text-white/50"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-white/30" />
                    {spec}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <SheetFooter className="border-t border-white/10">
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

              <span className="w-5 text-center text-sm text-white">
                {quantity}
              </span>

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
              className="flex-1 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buttonLabel}
            </button>
          </div>

          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-white/30">
            Preços demonstrativos
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
