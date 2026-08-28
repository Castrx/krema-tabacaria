import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { signOutAction } from "./actions";

/**
 * Shell de toda a área protegida do admin (grupo de rotas "(protected)" —
 * não aparece na URL, então o dashboard continua em /admin). app/admin/login
 * fica FORA deste grupo de propósito, para não herdar requireAdmin().
 *
 * requireAdmin() é a 2ª camada de proteção (a 1ª é o proxy.ts) — nunca
 * confiar só no proxy.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <span className="text-sm font-semibold">Painel administrativo</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">{user.email}</span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
