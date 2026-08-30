import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderForAdmin } from "@/lib/admin/orders";
import { OrderStatusBadge } from "../OrderStatusBadge";
import { OrderStatusControl } from "../OrderStatusControl";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
});

// Protegido pelo layout (requireAdmin()) — não precisa checar de novo
// aqui, só a Server Action de escrita (updateOrderStatusAction) precisa.
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderForAdmin(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin/orders"
          className="text-sm text-white/50 transition hover:text-white"
        >
          ← Voltar aos pedidos
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Pedido</h1>
            <p className="mt-1 font-mono text-xs text-white/50">{order.id}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <section className="grid gap-4 rounded-xl border border-white/10 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-white/50">Data</p>
          <p className="mt-1 text-sm text-white">
            {dateFormatter.format(new Date(order.createdAt))}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/50">Valor total</p>
          <p className="mt-1 text-sm text-white">
            {currencyFormatter.format(order.subtotalCents / 100)}
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 p-5">
        <h2 className="text-lg font-semibold">Status</h2>
        <OrderStatusControl orderId={order.id} status={order.status} />
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 p-5">
        <h2 className="text-lg font-semibold">Produtos</h2>

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs tracking-wide text-white/50 uppercase">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Variante</th>
                <th className="px-4 py-3 font-medium">Qtd.</th>
                <th className="px-4 py-3 font-medium">Preço unit.</th>
                <th className="px-4 py-3 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white">
                    {item.productNameSnapshot}
                    {!item.productId && (
                      <span className="ml-2 text-xs text-white/40">
                        (produto removido do catálogo)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {item.variantLabelSnapshot ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-white/70">{item.quantity}</td>
                  <td className="px-4 py-3 text-white/70">
                    {currencyFormatter.format(item.unitPriceCentsSnapshot / 100)}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {currencyFormatter.format(
                      (item.unitPriceCentsSnapshot * item.quantity) / 100,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
