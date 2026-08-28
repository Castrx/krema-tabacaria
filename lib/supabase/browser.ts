"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components da área /admin (ex.:
 * futuros componentes interativos que precisem reagir a mudanças de sessão
 * via supabase.auth.onAuthStateChange). Usa só a anon key.
 *
 * O fluxo de login/logout atual (Server Actions) não depende deste client
 * — ele existe como a peça de infraestrutura prevista na arquitetura
 * aprovada, para uso quando a UI do admin precisar de Supabase no browser.
 *
 * Cookies são geridas automaticamente (document.cookie) pelo próprio
 * @supabase/ssr — mesma sessão lida pelos clients de servidor, sem
 * configuração adicional.
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local (ver .env.example).",
    );
  }

  return createBrowserClient(url, anonKey);
}
