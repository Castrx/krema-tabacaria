"use client";

import { MessageCircle } from "lucide-react";
import type { CartItem } from "@/components/cart/CartProvider";
import { products } from "@/data/products";

const WHATSAPP_NUMBER = "5551992729284";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function buildOrderMessage(items: CartItem[], subtotal: number) {
  const lines = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;

      return `${item.quantity}x ${product.name} — ${currencyFormatter.format(product.price)} (preço demonstrativo)`;
    })
    .filter((line): line is string => Boolean(line));

  return [
    "Olá! Quero fazer um pedido na Krema:",
    "",
    ...lines,
    "",
    `Subtotal (demonstrativo): ${currencyFormatter.format(subtotal)}`,
  ].join("\n");
}

export function WhatsAppOrderLink({
  items,
  subtotal,
}: {
  items: CartItem[];
  subtotal: number;
}) {
  if (items.length === 0) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3.5 text-sm font-semibold text-white/40"
      >
        <MessageCircle className="size-4" />
        Enviar pedido pelo WhatsApp
      </button>
    );
  }

  const message = buildOrderMessage(items, subtotal);
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
    >
      <MessageCircle className="size-4" />
      Enviar pedido pelo WhatsApp
    </a>
  );
}
