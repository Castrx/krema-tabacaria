import type { OrderStatus } from "@/lib/admin/orders";

// Badge compartilhado entre a listagem e o detalhe do pedido. Cores
// restritas à paleta da Krema (preto/branco/cinza + vermelho já usado
// como cor de destrutivo em todo o admin) — nunca verde, mesmo para
// "confirmado" (ver AGENTS.md: verde não é cor estrutural da interface).
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "border border-white/15 text-white/70",
  confirmed: "border border-white/20 text-white",
  cancelled: "border border-red-400/30 bg-red-500/10 text-red-400",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs whitespace-nowrap ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
