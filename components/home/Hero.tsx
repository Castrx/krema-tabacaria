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
import { useRef } from "react";
import { WHATSAPP_NUMBER } from "@/lib/constants";

export function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);

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
              className="mt-6 h-px w-24 origin-left bg-[#d48a32] md:w-36"
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
              <Link
                href="#produtos"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-transform duration-300 hover:scale-[1.02]"
              >
                Explorar produtos
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Olá%20Krema!%20Vi%20o%20site%20e%20quero%20saber%20mais%20sobre%20os%20produtos.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:bg-white/10"
              >
                Falar no WhatsApp
              </a>
            </motion.div>
          </div>
        </div>
      </motion.div>

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