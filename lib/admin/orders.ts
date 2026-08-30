import { getSupabaseServiceClient } from "@/lib/supabase/service";

// Camada de dados do admin para pedidos — leitura e escrita SEMPRE via
// service role (server-only, nunca importado por Client Components).
//
// Por quê service role e não o client de sessão (anon key)? orders e
// order_items têm RLS habilitado e, de propósito, nenhuma policy pública
// para nenhuma operação (ver supabase/migrations/*_initial_catalog_schema)
// — nem SELECT. Autorização (requireAdmin()) é responsabilidade de quem
// chama — Server Actions em app/admin/(protected)/orders/actions.ts. Este
// módulo não repete a checagem, só executa a operação já autorizada.
//
// Esta é a primeira versão do gerenciamento de pedidos: só leitura +
// mudança de status. Nada de pagamento, frete, estoque ou exclusão de
// pedido — fora de escopo desta etapa.

export class OrderStatusValidationError extends Error {}

/** Únicos status permitidos nesta etapa. A coluna orders.status é `text`
 * livre no banco (sem CHECK constraint) — a validação do conjunto
 * permitido fica inteira aqui, no código, para não exigir uma migration
 * nesta etapa. */
export const ORDER_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export type AdminOrderListItem = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  /** Soma das quantidades de todos os itens do pedido (não a contagem de
   * linhas) — "quantos itens" no sentido de unidades, não de produtos
   * distintos. */
  itemCount: number;
  subtotalCents: number;
};

export type AdminOrderItem = {
  id: string;
  /** null quando o produto original foi apagado (order_items.product_id é
   * ON DELETE SET NULL) — o nome/preço exibidos vêm sempre do snapshot
   * abaixo, nunca deste id, então o histórico nunca quebra. */
  productId: string | null;
  productNameSnapshot: string;
  /** null quando o item não teve variante selecionada na compra. */
  variantLabelSnapshot: string | null;
  unitPriceCentsSnapshot: number;
  quantity: number;
};

export type AdminOrderDetail = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  subtotalCents: number;
  items: AdminOrderItem[];
};

type OrderListRow = {
  id: string;
  status: string;
  subtotal_cents: number;
  created_at: string;
  order_items: { quantity: number }[];
};

const ORDER_LIST_SELECT = `
  id,
  status,
  subtotal_cents,
  created_at,
  order_items ( quantity )
`;

/** Todos os pedidos, mais recentes primeiro — só para uso no painel
 * admin. */
export async function getAllOrdersForAdmin(): Promise<AdminOrderListItem[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `[lib/admin/orders] Falha ao carregar pedidos: ${error.message}`,
    );
  }

  return (data as unknown as OrderListRow[]).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    status: row.status as OrderStatus,
    itemCount: row.order_items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: row.subtotal_cents,
  }));
}

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_cents_snapshot: number;
  quantity: number;
  variant_label_snapshot: string | null;
};

type OrderDetailRow = {
  id: string;
  status: string;
  subtotal_cents: number;
  created_at: string;
  order_items: OrderItemRow[];
};

const ORDER_DETAIL_SELECT = `
  id,
  status,
  subtotal_cents,
  created_at,
  order_items (
    id,
    product_id,
    product_name_snapshot,
    unit_price_cents_snapshot,
    quantity,
    variant_label_snapshot
  )
`;

/** Pedido completo (com todos os itens) para a tela de detalhe — null se
 * o id não existir. */
export async function getOrderForAdmin(
  orderId: string,
): Promise<AdminOrderDetail | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_SELECT)
    .eq("id", orderId)
    .order("created_at", { referencedTable: "order_items", ascending: true })
    .maybeSingle();

  if (error) {
    throw new Error(
      `[lib/admin/orders] Falha ao carregar pedido: ${error.message}`,
    );
  }
  if (!data) {
    return null;
  }

  const row = data as unknown as OrderDetailRow;

  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status as OrderStatus,
    subtotalCents: row.subtotal_cents,
    items: row.order_items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productNameSnapshot: item.product_name_snapshot,
      variantLabelSnapshot: item.variant_label_snapshot,
      unitPriceCentsSnapshot: item.unit_price_cents_snapshot,
      quantity: item.quantity,
    })),
  };
}

/**
 * Altera o status de um pedido. Único campo que esta etapa permite
 * editar — nada de reescrever itens, subtotal ou snapshots, que
 * continuam sendo o registro fiel do que foi pedido no momento da compra.
 */
export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  if (!isOrderStatus(status)) {
    throw new OrderStatusValidationError(`Status inválido: "${status}".`);
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `[lib/admin/orders] Falha ao atualizar status do pedido: ${error.message}`,
    );
  }
  if (!data) {
    throw new OrderStatusValidationError("Pedido não encontrado.");
  }
}
