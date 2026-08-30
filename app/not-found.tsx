import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Só o title — sem entrar no escopo de OG/Twitter/canonical (nenhum
// buscador deveria indexar uma 404, e canonical não faz sentido para uma
// rota que não existe).
export const metadata: Metadata = {
  title: "Página não encontrada | Krema Tabacaria",
};

/**
 * 404 da Krema — substitui a página padrão (genérica, sem marca) do Next.
 * Mesma casca de todas as páginas públicas (Header + Footer), então
 * quem cai aqui por um link quebrado nunca perde a navegação do site.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Header />

      <section className="flex flex-col items-center px-5 py-32 text-center md:px-8 md:py-40">
        <span className="text-xs uppercase tracking-[0.28em] text-white/40">
          Erro 404
        </span>

        <h1 className="mt-5 text-6xl font-black tracking-[-0.03em] md:text-8xl">
          404
        </h1>

        <div className="mt-6 h-px w-24 bg-[#d48a32] md:w-36" />

        <p className="mt-6 max-w-md text-sm leading-7 text-white/55 md:text-base">
          A página que você tentou acessar não existe ou foi removida.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-transform duration-300 hover:scale-[1.02]"
        >
          <Home className="size-4" />
          Voltar para a loja
        </Link>
      </section>

      <Footer />
    </main>
  );
}
