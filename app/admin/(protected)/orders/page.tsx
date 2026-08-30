import { getAllOrdersForAdmin } from "@/lib/admin/orders";
import { OrdersTable } from "./OrdersTable";

// Server Component — já protegido pelo layout (requireAdmin()), não
// precisa checar autenticação de novo aqui. Leitura via service role
// (ver lib/admin/orders.ts): orders/order_items não têm nenhuma policy
// pública de SELECT.
export default async function AdminOrdersPage() {
  const orders = await getAllOrdersForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="mt-1 text-sm text-white/60">
          {orders.length} pedido{orders.length === 1 ? "" : "s"} registrado
          {orders.length === 1 ? "" : "s"}.
        </p>
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
}
