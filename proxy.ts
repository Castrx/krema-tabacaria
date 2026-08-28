import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Guarda de rota do painel administrativo.
 *
 * Nesta versão do Next.js (16), o antigo `middleware.ts` foi renomeado
 * para `proxy.ts` (exportando `proxy()` em vez de `middleware()`) — ver
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
 *
 * matcher restrito a /admin/:path* de propósito: nunca deve rodar no site
 * público (catálogo, carrinho, pedidos) — nem por custo de latência, nem
 * por escopo (esta etapa só cobre autenticação do admin).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
