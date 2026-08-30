"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/components/cart/CartProvider";
import { WhatsAppOrderLink } from "@/components/shared/WhatsAppOrderLink";
import {
  ProductImagePlaceholder,
  resolveProductImageUrl,
} from "@/components/product/ProductImagePlaceholder";
import type { ProductVariant } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function variantLabel(variant: ProductVariant): string {
  return [variant.color, variant.model].filter(Boolean).join(" · ") || variant.sku;
}

export function CartSheet() {
  const {
    items,
    isOpen,
    setOpen,
    increment,
    decrement,
    removeItem,
    subtotal,
    getProduct,
    getVariant,
    getItemPrice,
    isLoadingProducts,
  } = useCart();

  // Só no primeiro carregamento (nenhum item do carrinho atual ainda tem
  // produto resolvido) mostramos o estado de carregamento — evita esconder
  // itens já exibidos quando um novo item é adicionado depois.
  const noProductsResolvedYet =
    items.length > 0 && items.every((item) => !getProduct(item.productId));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => setOpen(open)}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="border-white/10 bg-[#0b0b0b] text-white"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-white/10">
          <SheetTitle className="text-white">Carrinho</SheetTitle>

          <SheetClose
            aria-label="Fechar carrinho"
            className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/45">
              Seu carrinho está vazio.
            </p>
          ) : isLoadingProducts && noProductsResolvedYet ? (
            <p className="py-10 text-center text-sm text-white/45">
              Carregando itens do carrinho...
            </p>
          ) : (
            <ul className="flex flex-col gap-4 py-2">
              {items.map((item) => {
                const product = getProduct(item.productId);
                if (!product) return null;

                const variant = getVariant(item.productId, item.variantId);
                // Item tem variantId mas a variante não existe mais
                // (removida/desativada desde que foi adicionada) — mesmo
                // tratamento que "produto removido do catálogo": omite a
                // linha em vez de mostrar dado inconsistente.
                if (item.variantId && !variant) return null;

                const price = getItemPrice(item);
                const imageUrl = resolveProductImageUrl(product);

                return (
                  <li
                    key={`${item.productId}:${item.variantId ?? ""}`}
                    className="flex gap-3"
                  >
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-[#141414]">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ProductImagePlaceholder className="h-full w-full" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {product.name}
                        </p>
                        {variant && (
                          <p className="mt-0.5 text-xs text-white/50">
                            {variantLabel(variant)}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-white/45">
                          {price !== undefined
                            ? currencyFormatter.format(price)
                            : "—"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 px-1.5 py-1">
                          <button
                            type="button"
                            onClick={() => decrement(item.productId, item.variantId)}
                            aria-label="Diminuir quantidade"
                            className="flex size-6 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                          >
                            <Minus className="size-3.5" />
                          </button>

                          <span className="w-4 text-center text-xs text-white">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => increment(item.productId, item.variantId)}
                            aria-label="Aumentar quantidade"
                            className="flex size-6 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          aria-label={`Remover ${product.name}`}
                          className="flex size-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Subtotal</span>
            <span className="font-semibold text-white">
              {currencyFormatter.format(subtotal)}
            </span>
          </div>

          <WhatsAppOrderLink />

          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
            Preços demonstrativos
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
