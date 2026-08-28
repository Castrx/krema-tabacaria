"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-8"
      >
        <div>
          <h1 className="text-xl font-semibold">Painel administrativo</h1>
          <p className="mt-1 text-sm text-white/50">Krema Tabacaria</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm text-white/70">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-white/70">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
