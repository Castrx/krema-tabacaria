"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function AboutKrema() {
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.04, 1]);

  return (
    <section
      ref={sectionRef}
      id="a-krema"
      className="overflow-hidden bg-[#080808] px-5 py-24 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Texto */}
          <motion.div
            initial={{
              opacity: 0,
              x: -30,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.25,
            }}
            transition={{
              duration: 0.7,
              ease: "easeOut",
            }}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              A Krema
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">
              Mais que uma tabacaria.
              <br />
              Uma experiência.
            </h2>

            <p className="mt-7 max-w-lg text-sm leading-8 text-white/50 md:text-base">
              Um espaço criado para reunir produtos, acessórios e uma
              experiência que combina com diferentes estilos.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-px w-14 bg-[#d48a32]" />

              <span className="text-[10px] uppercase tracking-[0.3em] text-white/35">
                Arroio do Sal — RS
              </span>
            </div>

            <div className="mt-10 inline-flex items-center gap-2 text-sm text-white/70">
              Conheça a loja
              <ArrowUpRight className="size-4" />
            </div>
          </motion.div>

          {/* Imagem */}
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[2rem] bg-[#111]">
              <motion.img
                src="/hero/hero-krema.png"
                alt="Interior da Krema Tabacaria e Head Shop"
                style={{
                  y: imageY,
                  scale: imageScale,
                }}
                className="aspect-[4/5] h-full w-full object-cover md:aspect-[16/10]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />

              <div className="absolute bottom-5 left-5 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white/60 backdrop-blur-md md:bottom-6 md:left-6">
                Krema Tabacaria & Head Shop
              </div>
            </div>

            {/* Elemento decorativo */}
            <div className="pointer-events-none absolute -bottom-4 -left-4 hidden size-24 rounded-full border border-[#d48a32]/20 md:block" />
            <div className="pointer-events-none absolute -right-5 -top-5 hidden size-16 rounded-full border border-white/10 md:block" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}