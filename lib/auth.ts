import { redirect } from "next/navigation";
import { getSupabaseServerSessionClient } from "@/lib/supabase/server-session";

/**
 * 2ª camada de proteção do painel administrativo (a 1ª é o proxy.ts).
 *
 * Chamada pelo layout de app/admin/(protected) — e deve ser chamada
 * também, no futuro, por qualquer Server Action ou Route Handler
 * administrativo (CRUD, quando implementado), nunca confiando que "só foi
 * possível chegar aqui porque passou pelo proxy": Server Actions podem
 * ser invocadas fora do fluxo de navegação normal que o proxy cobre.
 *
 * Exige:
 * 1. usuário autenticado (getUser() — revalida o JWT contra o servidor de
 *    Auth, não confia só no cookie local);
 * 2. user.app_metadata.role === "admin".
 *
 * Deliberadamente NUNCA lê user_metadata.role: user_metadata é editável
 * pelo próprio usuário via supabase.auth.updateUser() no client — usar
 * esse campo para autorização permitiria que qualquer usuário autenticado
 * se autopromovesse a admin. app_metadata só é alterável via service role
 * ou pelo Supabase Studio, nunca pelo próprio usuário.
 *
 * Redireciona para /admin/login em qualquer caso de falha — não lança
 * erro, não retorna null: quem chama sempre recebe um usuário admin
 * válido, ou a função nunca retorna (redirect() interrompe a execução).
 */
export async function requireAdmin() {
  const supabase = await getSupabaseServerSessionClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  if (user.app_metadata?.role !== "admin") {
    redirect("/admin/login");
  }

  return user;
}
