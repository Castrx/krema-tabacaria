import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase ciente de SESSÃO (cookies), para uso em Server
 * Components, Server Actions e Route Handlers da área /admin.
 *
 * Diferente de lib/supabase/server.ts (catálogo público, anon key, sem
 * cookies, sem noção de usuário logado) — este client existe só para o
 * fluxo de autenticação do admin. Usa a mesma anon key (nunca a service
 * role: autenticação/autorização aqui depende só do JWT do próprio
 * usuário + RLS, não de um bypass de privilégio).
 *
 * Cria um client novo a cada chamada, como recomendado pela Supabase para
 * SSR — nunca compartilhar entre requisições.
 */
export async function getSupabaseServerSessionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local (ver .env.example).",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // cookies() só permite escrita dentro de Server Actions/Route
          // Handlers — chamado a partir de um Server Component (ex.:
          // requireAdmin() no layout protegido), set() lança. Isso é
          // seguro ignorar aqui: o proxy.ts já garante que a sessão é
          // atualizada a cada navegação para /admin/*. Padrão documentado
          // pela própria Supabase para o App Router.
        }
      },
    },
  });
}
