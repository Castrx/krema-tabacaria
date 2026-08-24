"use client";

import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/data/products";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

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

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setQuantity(1);
  };

  const handleAdd = () => {
    addItem(product.id, quantity);
    handleOpenChange(false);
  };

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
            <img
              src={product.images[0] ?? product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />

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

            <p className="mt-2 text-lg font-semibold text-white">
              {currencyFormatter.format(product.price)}
            </p>

            <p className="mt-4 text-sm leading-6 text-white/60">
              {product.shortDescription}
            </p>

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
              className="flex-1 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Adicionar ao carrinho
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
