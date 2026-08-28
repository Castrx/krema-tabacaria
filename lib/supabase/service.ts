import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service role key — ignora Row Level Security por
 * completo.
 *
 * Uso extremamente restrito: SOMENTE para o caminho de escrita de pedidos
 * (lib/orders.ts → RPC create_order), que não tem — de propósito — policy
 * pública de INSERT em orders/order_items.
 *
 * NÃO importar em Client Components. NÃO usar para ler catálogo — leitura
 * pública já é coberta por lib/supabase/server.ts (anon key + RLS); usar a
 * service role para isso seria escopo de permissão desnecessariamente
 * amplo para uma simples leitura.
 */
export function getSupabaseServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase (service role) não configurado: defina NEXT_PUBLIC_SUPABASE_URL e " +
        "SUPABASE_SERVICE_ROLE_KEY em .env.local (ver .env.example).",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
