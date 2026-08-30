import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Casca compartilhada das 3 páginas legais (Política de Privacidade, Termos
 * de Uso, Trocas e Devoluções) — mesma identidade visual do resto do site
 * (Header/Footer, fundo escuro, container centralizado).
 *
 * Nenhuma das três tem texto jurídico/comercial ainda: este componente só
 * monta a estrutura (título + aviso de conteúdo pendente) que vai receber
 * o texto oficial da Krema quando o proprietário fornecer e aprovar. O
 * aviso abaixo é deliberadamente explícito — em código e na tela — que
 * esta página NÃO é uma política válida para clientes enquanto o texto
 * oficial não substituir este aviso.
 */
export function LegalPagePlaceholder({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Header />

      <section className="px-5 pb-24 pt-32 md:px-8 md:pt-40">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
          >
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Voltar para a loja
          </Link>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
            {title}
          </h1>

          {/* Aviso de conteúdo pendente — não é o texto oficial da página,
              é a própria ausência dele sendo comunicada. Nunca remover
              este bloco silenciosamente: ele só deve sair quando for
              substituído pelo texto real aprovado pelo proprietário. */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Conteúdo pendente
            </p>
            <p className="mt-4 text-sm leading-7 text-white/60 md:text-base">
              Esta página ainda não contém o texto oficial de{" "}
              {title.toLowerCase()} da Krema Tabacaria. O conteúdo
              definitivo será fornecido e aprovado pelo proprietário da
              Krema antes do lançamento.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/60 md:text-base">
              Até lá, esta página é apenas um espaço reservado — ela não
              deve ser considerada uma política válida ou vinculante para
              clientes.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
