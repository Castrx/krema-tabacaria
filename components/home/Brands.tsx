"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";

const brands = [
  {
    name: "SQUADAFUM",
    subtitle: "Acessórios",
  },
  {
    name: "RAW",
    subtitle: "Smoking",
  },
  {
    name: "FIRESTAR",
    subtitle: "Isqueiros",
  },
  {
    name: "SADHU",
    subtitle: "Dichavadores",
  },
  {
    name: "WORLDFIRE",
    subtitle: "Maçaricos",
  },
];

export function Brands() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;

    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="marcas"
      className="overflow-hidden border-y border-white/[0.06] bg-[#0b0b0b] px-5 py-20 text-white md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-6 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Marcas
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Marcas que fazem parte da Krema.
            </h2>
          </motion.div>

          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Voltar marcas"
              className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Avançar marcas"
              className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.55,
                delay: index * 0.06,
              }}
              className="group min-w-[240px] snap-start md:min-w-[300px]"
            >
              <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#101010] p-7 transition duration-500 group-hover:border-white/15 group-hover:bg-[#141414] md:p-8">
                <div className="flex min-h-[150px] items-center justify-center">
                  <span className="text-center text-3xl font-black tracking-[-0.04em] text-white/90 transition duration-500 group-hover:scale-[1.04] group-hover:text-white md:text-4xl">
                    {brand.name}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                    {brand.subtitle}
                  </span>

                  <span className="text-xs text-white/25 transition group-hover:text-white/60">
                    →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/25">
          <span>Arraste para explorar</span>
          <span>Marcas parceiras</span>
        </div>
      </div>
    </section>
  );
}