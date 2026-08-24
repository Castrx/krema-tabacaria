"use client";

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
import { products } from "@/data/products";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function CartSheet() {
  const {
    items,
    isOpen,
    setOpen,
    increment,
    decrement,
    removeItem,
    subtotal,
  } = useCart();

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
          ) : (
            <ul className="flex flex-col gap-4 py-2">
              {items.map((item) => {
                const product = products.find(
                  (p) => p.id === item.productId,
                );

                if (!product) return null;

                return (
                  <li key={item.productId} className="flex gap-3">
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-[#141414]">
                      <img
                        src={product.images[0] ?? product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-white/45">
                          {currencyFormatter.format(product.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 px-1.5 py-1">
                          <button
                            type="button"
                            onClick={() => decrement(item.productId)}
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
                            onClick={() => increment(item.productId)}
                            aria-label="Aumentar quantidade"
                            className="flex size-6 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
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

          <WhatsAppOrderLink items={items} subtotal={subtotal} />

          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
            Preços demonstrativos
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
