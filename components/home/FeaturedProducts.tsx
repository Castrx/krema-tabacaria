"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { products } from "@/data/products";

const featuredProductIds = [
  "sadhu-black-edition",
  "firestar-planet-signos",
  "cinzeiro-squadafum-quadrado",
  "bong-colter-laranja",
  "worldfire-emborrachado",
];

const featuredProducts = featuredProductIds
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is (typeof products)[number] => Boolean(product));

export function FeaturedProducts() {
  return (
    <section
      id="produtos"
      className="overflow-hidden bg-[#080808] px-5 py-24 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-end justify-between gap-8 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">
              Destaques
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
              O que está chamando atenção.
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 md:text-base">
              Alguns dos produtos que representam a variedade e o estilo da
              Krema.
            </p>
          </motion.div>

          <Link
            href="#categorias"
            className="group hidden items-center gap-2 text-sm text-white/55 transition hover:text-white sm:flex"
          >
            Ver categorias
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {featuredProducts.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.6,
                delay: index * 0.07,
                ease: "easeOut",
              }}
              className="group relative w-[78vw] max-w-[420px] shrink-0 snap-start sm:w-[55vw] md:w-[38vw] lg:w-[31vw]"
            >
              <Link href="#produtos">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#111]">
                  <motion.img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{
                      duration: 0.7,
                      ease: "easeOut",
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        {product.brand && (
                          <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/45">
                            {product.brand}
                          </p>
                        )}

                        <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                          {product.name}
                        </h3>

                        <p className="mt-2 text-sm text-white/50">
                          {product.category}
                        </p>
                      </div>

                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition duration-300 group-hover:bg-white group-hover:text-black">
                        <ArrowUpRight className="size-5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/30">
          <span>Arraste para explorar</span>
          <span>{featuredProducts.length} destaques</span>
        </div>
      </div>
    </section>
  );
}