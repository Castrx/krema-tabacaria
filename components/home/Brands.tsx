"use client";

import { motion } from "motion/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type Brand = {
  name: string;
  logo: string;
};

const brands: Brand[] = [
  { name: "Squadafum", logo: "/brands/squadafum.png" },
  { name: "RAW", logo: "/brands/raw.png" },
  { name: "FireStar", logo: "/brands/FireStar.png" },
  { name: "Sadhu", logo: "/brands/sadhu.png" },
];

export function Brands() {
  return (
    <section
      id="marcas"
      className="border-y border-white/[0.06] bg-[#080808] px-5 py-20 text-white md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-3xl font-semibold tracking-tight md:mb-16 md:text-5xl"
        >
          Marcas que fazem parte da Krema.
        </motion.h2>

        <Carousel opts={{ loop: true, align: "start" }}>
          <CarouselContent>
            {brands.map((brand) => (
              <CarouselItem key={brand.name} className="basis-auto pl-8 md:pl-14">
                <div className="flex h-16 items-center sm:h-24 md:h-32">
                  <img
                    src={brand.logo}
                    alt={`Logo da marca ${brand.name}`}
                    className="h-full w-auto object-contain opacity-90 transition duration-300 hover:scale-105 hover:opacity-100"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious
            aria-label="Voltar marcas"
            size="icon-lg"
            className="hidden border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white md:flex"
          />
          <CarouselNext
            aria-label="Avançar marcas"
            size="icon-lg"
            className="hidden border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white md:flex"
          />
        </Carousel>
      </div>
    </section>
  );
}
