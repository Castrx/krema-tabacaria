import Link from "next/link";
import type { AdminOrderListItem } from "@/lib/admin/orders";
import { OrderStatusBadge } from "./OrderStatusBadge";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Listagem de pedidos — Server Component puro (sem interatividade: a
 * única ação é navegar para o detalhe, então não precisa de "use client",
 * diferente de ProductsTable que tem o botão de ativar/desativar). */
export function OrdersTable({ orders }: { orders: AdminOrderListItem[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-white/60">Nenhum pedido registrado ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs tracking-wide text-white/50 uppercase">
            <th className="px-4 py-3 font-medium">Pedido</th>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Itens</th>
            <th className="px-4 py-3 font-medium">Subtotal</th>
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-white/5 last:border-0">
              <td
                className="px-4 py-3 font-mono text-xs text-white/70"
                title={order.id}
              >
                #{order.id.slice(0, 8)}
              </td>
              <td className="px-4 py-3 text-white/70">
                {dateFormatter.format(new Date(order.createdAt))}
              </td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-white/70">{order.itemCount}</td>
              <td className="px-4 py-3 text-white/70">
                {currencyFormatter.format(order.subtotalCents / 100)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Ver pedido
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
