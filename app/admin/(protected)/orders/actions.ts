"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  setOrderStatus,
  OrderStatusValidationError,
  type OrderStatus,
} from "@/lib/admin/orders";

export type OrderStatusActionState = {
  error: string | null;
};

/**
 * Server Action chamada pelo controle de status de OrderStatusControl.
 *
 * requireAdmin() é chamada aqui dentro, sempre — nunca confiar que só foi
 * possível chegar até aqui porque passou pelo proxy/layout: Server
 * Actions podem ser invocadas fora do fluxo de navegação normal.
 */
export async function updateOrderStatusAction(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<OrderStatusActionState> {
  await requireAdmin();

  if (!orderId) {
    return { error: "Pedido inválido." };
  }

  try {
    await setOrderStatus(orderId, nextStatus);
  } catch (err) {
    if (err instanceof OrderStatusValidationError) {
      return { error: err.message };
    }
    return {
      error:
        err instanceof Error
          ? err.message
          : "Falha ao atualizar status do pedido.",
    };
  }

  // Revalida tanto a listagem quanto a página de detalhe — o Client
  // Component que chamou esta action já atualiza o próprio estado local,
  // mas isso garante que uma navegação de volta para /admin/orders (ou um
  // refresh do detalhe) sempre reflita o status novo.
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  return { error: null };
}
