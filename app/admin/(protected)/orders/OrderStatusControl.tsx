"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@/lib/admin/orders";
import { updateOrderStatusAction } from "./actions";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "cancelled", label: "Cancelado" },
];

const ACTIVE_CLASS: Record<OrderStatus, string> = {
  pending: "border border-white/20 bg-white/10 text-white",
  confirmed: "border border-white bg-white font-semibold text-black",
  cancelled: "border border-red-400/40 bg-red-500/15 text-red-400",
};

const INACTIVE_CLASS =
  "border border-white/10 text-white/70 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Controle de status do pedido — 3 botões (pending/confirmed/cancelled),
 * o atual desabilitado e destacado. Client Component: precisa de
 * window.confirm() antes de cancelar e de estado local para refletir a
 * mudança sem esperar a navegação recarregar a página (a Server Action já
 * chama revalidatePath(), isto só evita um piscar de UI).
 */
export function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: OrderStatus) {
    if (next === current || isPending) return;

    // Único caso desta etapa que exige confirmação explícita — mudar para
    // pendente/confirmado é reversível sem risco visível, cancelar não.
    if (next === "cancelled") {
      const confirmed = window.confirm(
        "Tem certeza que deseja cancelar este pedido?",
      );
      if (!confirmed) return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, next);
      if (result.error) {
        setError(result.error);
      } else {
        setCurrent(next);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => {
          const isActive = option.value === current;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange(option.value)}
              disabled={isPending || isActive}
              className={`rounded-full px-3.5 py-1.5 text-xs ${
                isActive ? ACTIVE_CLASS[option.value] : INACTIVE_CLASS
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {isPending && (
        <p className="text-xs text-white/40">Atualizando status...</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
