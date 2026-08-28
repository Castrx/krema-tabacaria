import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para uso exclusivo em Server Components e código de
 * servidor (rotas, server actions). Usa somente a anon key — respeita Row
 * Level Security normalmente, sem privilégios elevados. Nunca usa
 * SUPABASE_SERVICE_ROLE_KEY.
 *
 * NÃO importar este módulo em Client Components ("use client"). Mesmo a
 * anon key sendo pública por natureza (protegida pelas policies de RLS, não
 * por sigilo), a camada de acesso ao catálogo desta fase é inteiramente
 * server-side, por design — ver lib/products.ts.
 *
 * Cria um cliente novo a cada chamada: é um wrapper leve sobre chamadas
 * HTTP (PostgREST), sem pool de conexão para gerenciar.
 */
export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local (ver .env.example).",
    );
  }

  return createClient(url, anonKey, {
    auth: {
      // Sem sessão de usuário nesta fase — apenas leitura pública do catálogo.
      persistSession: false,
    },
  });
}
