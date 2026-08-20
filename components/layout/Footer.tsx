import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  MessageCircle,
  MapPin,
} from "lucide-react";

const links = [
  { label: "Produtos", href: "#produtos" },
  { label: "Categorias", href: "#categorias" },
  { label: "Marcas", href: "#marcas" },
  { label: "A Krema", href: "#a-krema" },
  { label: "Localização", href: "#localizacao" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Link href="/" aria-label="Krema - início">
              <img
                src="/brand/krema-logo.png"
                alt="Krema Tabacaria e Head Shop"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/40">
              Tabacaria & Head Shop em Arroio do Sal, RS.
              <br />
              Produtos, acessórios e estilo.
            </p>
          </div>

          <nav
            aria-label="Links do rodapé"
            className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-3 lg:grid-cols-5"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/50 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="my-12 h-px bg-white/[0.07]" />

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/25">
              Visite a loja
            </p>

            <p className="mt-3 text-sm text-white/55">
              Rua Paulista, nº 37 · Centro
              <br />
              Arroio do Sal — RS
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://instagram.com/krematabacaria"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Camera className="size-4" />
              Instagram
              <ArrowUpRight className="size-3.5" />
            </a>

            <a
              href="https://wa.me/5551992729284"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              <MessageCircle className="size-4" />
              WhatsApp
              <ArrowUpRight className="size-3.5" />
            </a>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Rua+Paulista+37+Centro+Arroio+do+Sal+RS"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white"
            >
              <MapPin className="size-4" />
              Localização
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-[10px] uppercase tracking-[0.2em] text-white/20 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Krema</span>
          <span>Tabacaria & Head Shop</span>
        </div>
      </div>
    </footer>
  );
}