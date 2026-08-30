"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { WHATSAPP_NUMBER } from "@/lib/constants";

// Link (Next.js) precisa passar por motion.create() pra virar animável —
// mesmo padrão de MotionImage já usado em AboutKrema/Header/ProductCard.
const MotionLink = motion.create(Link);

// Mesmo glifo oficial do WhatsApp já usado em components/layout/Footer.tsx
// (lucide-react não tem ícone de marca) — duplicado aqui, não extraído pra
// um arquivo compartilhado, porque esta tarefa pede explicitamente pra não
// tocar em Footer.tsx.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.943c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.447h.005c6.582 0 11.94-5.363 11.943-11.946 0-3.19-1.242-6.19-3.473-8.4" />
    </svg>
  );
}

// Press do botão circular de WhatsApp: mesmo raciocínio de ctaTapAnimation
// abaixo (scale é posicional, já coberto por reducedMotion="user").
const whatsappFabTap = {
  scale: 0.97,
  transition: { duration: 0.12, ease: "easeOut" as const },
};

// Press dos dois CTAs do Hero: scale é um valor posicional, então o
// MotionConfigProvider (reducedMotion="user", em app/layout.tsx) já torna
// esse "press" instantâneo pra quem pede "reduzir movimento" — sem
// precisar de nenhum tratamento extra aqui.
const ctaTapAnimation = {
  scale: 0.975,
  transition: { duration: 0.12, ease: "easeOut" as const },
};

/**
 * Ícone dos dois CTAs do Hero — desloca alguns pixels para a direita
 * enquanto `active` (controlado pelo onHoverStart/onHoverEnd do botão
 * pai via useState, não por CSS group-hover) pra reagir ao hover em
 * qualquer ponto do botão, não só quando o cursor está exatamente sobre
 * o SVG. x é um valor posicional, então o MotionConfigProvider citado
 * acima já cobre reduced motion sem tratamento extra aqui.
 */
function HeroCtaIcon({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <motion.span
      animate={{ x: active ? 4 : 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="inline-flex"
    >
      {children}
    </motion.span>
  );
}

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const [exploreHovered, setExploreHovered] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // useScroll()+useTransform() ligados direto a `style` (parallax) não
  // passam pelo motor de animação da Motion — diferente de
  // initial/animate/whileHover/whileInView (usados no resto do site), o
  // MotionConfig reducedMotion="user" em MotionConfigProvider não alcança
  // isto. Por isso, só aqui e em AboutKrema.tsx, colapsa-se manualmente o
  // intervalo de saída para "sem deslocamento/zoom" quando o usuário pede
  // "reduzir movimento" — a opacidade do texto continua desvanecendo
  // normalmente (opacidade não é um valor posicional/causador de motion
  // sickness), então o conteúdo nunca deixa de aparecer, só perde o
  // parallax.
  const shouldReduceMotion = useReducedMotion();

  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? ["0%", "0%"] : ["0%", "12%"],
  );
  const imageScale = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [1, 1] : [1, 1.06],
  );

  const contentY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? ["0%", "0%"] : ["0%", "-8%"],
  );
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.75],
    [1, 0],
  );

  return (
    <section
      ref={heroRef}
      className="relative min-h-dvh overflow-hidden bg-[#080808] text-white"
    >
      {/* IMAGEM DE FUNDO */}
      <motion.div
        style={{
          y: imageY,
          scale: imageScale,
        }}
        initial={{
          opacity: 0,
          scale: 1.03,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 1,
          ease: "easeOut",
        }}
        className="absolute inset-0"
      >
        <Image
          src="/hero/hero-krema.png"
          alt="Interior da Krema Tabacaria e Head Shop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* ESCURECIMENTO GERAL */}
      <div className="absolute inset-0 bg-black/30" />

      {/* ESCURECIMENTO FORTE SOMENTE NA ESQUERDA */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/5" />

      {/* ESCURECIMENTO NA PARTE INFERIOR */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />

      {/* CONTEÚDO */}
      <motion.div
        style={{
          y: contentY,
          opacity: contentOpacity,
        }}
        className="relative z-10 flex min-h-dvh items-center px-6 pt-24 md:px-10 lg:px-16"
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <motion.p
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.2,
                duration: 0.5,
              }}
              className="text-xs font-medium uppercase tracking-[0.38em] text-white/55 md:text-sm"
            >
              Tabacaria & Head Shop
            </motion.p>

            <motion.h1
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.3,
                duration: 0.7,
              }}
              className="mt-5 text-[4.5rem] font-black leading-[0.84] tracking-[-0.065em] md:text-[7rem] lg:text-[8.5rem]"
            >
              KREMA
            </motion.h1>

            <motion.div
              initial={{
                scaleX: 0,
              }}
              animate={{
                scaleX: 1,
              }}
              transition={{
                delay: 0.7,
                duration: 0.6,
              }}
              className="mt-6 h-px w-28 origin-left bg-[#d48a32] md:w-40"
            />

            <motion.p
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.8,
                duration: 0.5,
              }}
              className="mt-6 max-w-lg text-sm leading-7 text-white/70 md:text-base md:leading-8"
            >
              Qualidade e estilo em um só lugar.
              <br className="hidden md:block" />
              Descubra a experiência Krema.
            </motion.p>

            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.95,
                duration: 0.5,
              }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <MotionLink
                href="#produtos"
                onHoverStart={() => setExploreHovered(true)}
                onHoverEnd={() => setExploreHovered(false)}
                whileTap={ctaTapAnimation}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-semibold tracking-wide text-black transition-colors duration-300 ease-out hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] focus-visible:ring-[#d48a32]/70"
              >
                Explorar produtos
                <HeroCtaIcon active={exploreHovered}>
                  <ArrowRight className="size-4" />
                </HeroCtaIcon>
              </MotionLink>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* CTA CIRCULAR DE WHATSAPP — canto inferior direito, acima do rodapé
          do Hero (bottom-7) pra nunca sobrepor o indicador de "Scroll",
          que já ocupa esse canto. Mesma mensagem/número que o antigo botão
          "Falar no WhatsApp" (removido), só que sem texto. */}
      <motion.a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Olá%20Krema!%20Vi%20o%20site%20e%20quero%20saber%20mais%20sobre%20os%20produtos.`}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        whileHover={{ scale: 1.06 }}
        whileTap={whatsappFabTap}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute bottom-24 right-6 z-20 flex size-12 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors duration-300 ease-out hover:border-white/25 hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] focus-visible:ring-[#d48a32]/70 md:right-10 lg:right-16"
      >
        <WhatsAppIcon className="size-5" />
      </motion.a>

      {/* RODAPÉ DO HERO */}
      <div className="absolute bottom-7 left-6 right-6 z-10 flex items-center justify-between md:left-10 md:right-10 lg:left-16 lg:right-16">
        <span className="hidden text-[10px] uppercase tracking-[0.28em] text-white/40 sm:block">
          Arroio do Sal — RS
        </span>

        <motion.div
          animate={{
            y: [0, 5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
          className="ml-auto flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/45"
        >
          Scroll
          <ArrowDown className="size-4" />
        </motion.div>
      </div>
    </section>
  );
}