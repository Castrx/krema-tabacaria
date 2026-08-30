"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { WHATSAPP_NUMBER } from "@/lib/constants";

/**
 * Antes de abrir o WhatsApp, registra o pedido no Supabase (POST
 * /api/orders) — preço, nome, rótulo da variante e subtotal são
 * resolvidos e a mensagem é montada no servidor (lib/orders.ts), nunca a
 * partir do que está no carrinho local. O client só envia productId +
 * variantId (quando o item tiver variante) + quantity — exatamente o que
 * já está em CartItem, sem nenhum dado derivado calculado aqui.
 */
export function WhatsAppOrderLink() {
  const { items } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleClick = async () => {
    if (isSubmitting) return;

    // Abre a aba já no clique, de forma síncrona (gesto direto do
    // usuário) — se esperássemos o fetch terminar para só então chamar
    // window.open(), o navegador bloquearia como pop-up.
    const whatsappTab = window.open("", "_blank", "noopener,noreferrer");

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ?? `Não foi possível criar o pedido (${response.status}).`,
        );
      }

      const { message } = (await response.json()) as {
        orderId: string;
        message: string;
      };
      const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

      if (whatsappTab) {
        whatsappTab.location.href = href;
      } else {
        // Pop-up bloqueado mesmo com a abertura síncrona (raro) — navega a
        // aba atual como alternativa, em vez de falhar silenciosamente.
        window.location.href = href;
      }
    } catch (err) {
      whatsappTab?.close();
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar o pedido. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MessageCircle className="size-4" />
        {isSubmitting ? "Enviando pedido..." : "Enviar pedido pelo WhatsApp"}
      </button>

      {error && <p className="text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
