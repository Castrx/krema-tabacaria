"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerSessionClient } from "@/lib/supabase/server-session";

export type SignInState = {
  error: string | null;
};

/**
 * Server Action do formulário de login do admin. Só email/senha — sem
 * cadastro, sem recuperação de senha, sem OAuth (fora de escopo desta
 * etapa).
 *
 * Depois de autenticar com sucesso, confere app_metadata.role === "admin"
 * imediatamente: se a credencial é válida mas o usuário não é admin, essa
 * sessão é encerrada (signOut) e o erro devolvido ao formulário — melhor
 * que deixar um cookie de sessão "autenticado, mas nunca vai passar de
 * /admin/login" pendurado no navegador. requireAdmin() (lib/auth.ts)
 * continua sendo a autoridade de verdade, chamada de novo pelo layout
 * protegido em toda requisição — este check aqui é só para dar feedback
 * claro no próprio formulário, não substitui aquele.
 */
export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await getSupabaseServerSessionClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "E-mail ou senha inválidos." };
  }

  if (data.user.app_metadata?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Este usuário não tem acesso ao painel administrativo." };
  }

  redirect("/admin");
}
