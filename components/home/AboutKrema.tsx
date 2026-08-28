"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

// Componente animável combinando next/image (otimização) com Motion
// (parallax via style) — necessário porque o efeito é aplicado direto na
// imagem, não em um wrapper.
const MotionImage = motion.create(Image);

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
      className="overflow-hidden bg-[#080808] px-5 py-14 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
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
            <h2 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">
              Mais que uma tabacaria.
              <br />
              Uma experiência.
            </h2>

            <p className="mt-7 max-w-md text-sm leading-8 text-white/50 md:text-base">
              Produtos, acessórios e atmosfera para diferentes estilos.
            </p>
          </motion.div>

          {/* Imagem — fallback temporário, trocar por fotografia real da loja */}
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
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-[#111] md:aspect-[16/10]">
              <MotionImage
                src="/hero/hero-krema.png"
                alt="Interior da Krema Tabacaria e Head Shop"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                style={{
                  y: imageY,
                  scale: imageScale,
                }}
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
