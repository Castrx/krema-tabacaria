"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  MapPin,
  MessageCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CartButton } from "@/components/cart/CartButton";
import { CartSheet } from "@/components/cart/CartSheet";
import { ProductSearchButton } from "@/components/product/ProductSearch";

// Combina next/image (otimização) com a animação de encolher no scroll,
// que anima width/height diretamente na imagem do logo desktop.
const MotionImage = motion.create(Image);

// Itens de navegação por âncora da Home. Fora da Home, "id" vira "/#id" —
// exceto quando há uma rota própria (ex.: Produtos → /produtos).
const navItems = [
  { label: "Produtos", id: "produtos", awayHref: "/produtos" },
  { label: "Categorias", id: "categorias" },
  { label: "Marcas", id: "marcas" },
  { label: "A Krema", id: "a-krema" },
  { label: "Localização", id: "localizacao" },
];

function resolveNavHref(
  item: { id: string; awayHref?: string },
  isHome: boolean,
) {
  if (isHome) return `#${item.id}`;
  return item.awayHref ?? `/#${item.id}`;
}

// lucide-react não inclui ícones de marca — SVG local no estilo dos demais ícones (stroke, 24x24)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: scrolled
            ? "rgba(8, 8, 8, 0.84)"
            : "rgba(8, 8, 8, 0)",
        }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 backdrop-blur-md"
      >
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          {/* Desktop row */}
          <motion.div
            initial={false}
            animate={{
              paddingTop: scrolled ? "0.45rem" : "0.65rem",
              paddingBottom: scrolled ? "0.45rem" : "0.65rem",
            }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            className="hidden items-center md:flex"
          >
            {/* Desktop logo */}
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label="Krema - início"
            >
              <MotionImage
                src="/brand/krema-logo.png"
                alt="Krema Tabacaria e Head Shop"
                width={150}
                height={150}
                priority
                initial={false}
                animate={{
                  width: scrolled ? 51 : 59,
                  height: scrolled ? 51 : 59,
                }}
                transition={{
                  duration: 0.25,
                  ease: "easeOut",
                }}
                className="object-contain"
              />
            </Link>

            {/* Desktop navigation */}
            <nav
              className="ml-8 flex items-center gap-8"
              aria-label="Navegação principal"
            >
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={resolveNavHref(item, isHome)}
                  className="rounded-full px-2 py-2 text-sm font-medium text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop actions */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <ProductSearchButton />

              <a
                href="https://instagram.com/krematabacaria"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram da Krema"
                className="rounded-full p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <InstagramIcon className="size-5" />
              </a>

              <CartButton />
            </div>
          </motion.div>

          {/* Mobile row */}
          <div className="flex items-center justify-between py-2.5 md:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              className="-ml-1 rounded-full p-3 text-white transition hover:bg-white/10 active:bg-white/15"
            >
              <Menu className="size-5" />
            </button>

            <Link href="/" aria-label="Krema - início">
              <Image
                src="/brand/krema-logo.png"
                alt="Krema"
                width={150}
                height={150}
                priority
                className="h-11 w-auto object-contain"
              />
            </Link>

            <div className="-mr-1 flex items-center">
              <ProductSearchButton className="p-3 text-white active:bg-white/15" />
              <CartButton className="p-3 text-white active:bg-white/15" />
            </div>
          </div>
        </div>
      </motion.header>

      <CartSheet />

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl md:hidden"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              className="flex min-h-dvh flex-col px-6 py-6"
            >
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Krema - início"
                >
                  <Image
                    src="/brand/krema-logo.png"
                    alt="Krema"
                    width={150}
                    height={150}
                    className="h-10 w-auto"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Fechar menu"
                  className="rounded-full border border-white/10 p-3 text-white/80 transition hover:bg-white/10"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav
                className="mt-16 flex flex-col"
                aria-label="Menu mobile"
              >
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{
                      opacity: 0,
                      x: -16,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.25,
                      ease: "easeOut",
                    }}
                  >
                    <Link
                      href={resolveNavHref(item, isHome)}
                      onClick={() => setMenuOpen(false)}
                      className="block border-b border-white/10 py-5 text-3xl font-medium tracking-tight text-white transition-colors hover:text-white/60"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto grid grid-cols-3 gap-3 pb-4">
                <a
                  href="https://instagram.com/krematabacaria"
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white transition hover:bg-white/[0.08]"
                >
                  <InstagramIcon className="size-5" />
                  <span className="text-xs text-white/65">
                    Instagram
                  </span>
                </a>

                <a
                  href="https://wa.me/5551992729284"
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white transition hover:bg-white/[0.08]"
                >
                  <MessageCircle className="size-5" />
                  <span className="text-xs text-white/65">
                    WhatsApp
                  </span>
                </a>

                <a
                  href={resolveNavHref({ id: "localizacao" }, isHome)}
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white transition hover:bg-white/[0.08]"
                >
                  <MapPin className="size-5" />
                  <span className="text-xs text-white/65">
                    Local
                  </span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}