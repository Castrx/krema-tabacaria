"use client";

import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartProvider";

export function CartButton({ className }: { className?: string }) {
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={
        count > 0
          ? `Abrir carrinho, ${count} ${count === 1 ? "item" : "itens"}`
          : "Abrir carrinho"
      }
      className={cn(
        "relative rounded-full p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      <ShoppingBag className="size-5" />

      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#d48a32] text-[10px] font-semibold leading-none text-black">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
