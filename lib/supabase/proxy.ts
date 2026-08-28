import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * updateSession() — chamada pelo proxy.ts (raiz do projeto) em toda
 * requisição a /admin/:path* (ver matcher em proxy.ts).
 *
 * Responsabilidades:
 * 1. Ler/escrever os cookies de sessão do Supabase Auth via getAll/setAll
 *    (padrão atual do @supabase/ssr — get/set/remove individuais estão
 *    depreciados).
 * 2. Chamar supabase.auth.getUser(), que revalida o JWT contra o servidor
 *    de Auth (diferente de getSession(), que só leria o cookie local sem
 *    validar) — e, de quebra, atualiza silenciosamente o token quando
 *    perto de expirar, mantendo a sessão persistente sem novo login.
 * 3. Redirecionar para /admin/login quando não há usuário autenticado —
 *    exceto na própria /admin/login, que precisa continuar acessível para
 *    quem ainda não está logado.
 *
 * Esta é a 1ª camada de proteção (defesa em profundidade). A 2ª é
 * requireAdmin() em lib/auth.ts, chamada pelo layout protegido — nunca
 * confiar só no proxy (Server Actions podem ser invocadas fora do fluxo
 * de navegação normal que o proxy cobre).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local (ver .env.example).",
    );
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Precisa ser refletido tanto na request (para o resto deste
        // proxy/handlers a jusante enxergarem o cookie atualizado) quanto
        // na response (para o navegador de fato gravar o cookie novo).
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginPage) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // response carrega os cookies de sessão (possivelmente atualizados pelo
  // setAll acima) — precisa ser o que o proxy.ts efetivamente retorna,
  // mesmo quando não há redirect.
  return response;
}
