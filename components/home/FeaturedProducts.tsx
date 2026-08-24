"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { products } from "@/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";

const featuredProductIds = [
  "sadhu-black-edition",
  "firestar-planet-signos",
  "cinzeiro-squadafum-quadrado",
  "bong-colter-laranja",
  "worldfire-emborrachado",
  "kit-acessorios-case",
  "firestar-mini-torch",
  "cinzeiro-tonabe-hype",
];

const featuredProducts = featuredProductIds
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is (typeof products)[number] => Boolean(product));

export function FeaturedProducts() {
  return (
    <section
      id="produtos"
      className="bg-[#080808] px-5 py-14 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-8 md:mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-semibold tracking-[-0.03em] md:text-6xl"
          >
            O que está chamando atenção.
          </motion.h2>

          <Link
            href="/produtos"
            className="group hidden items-center gap-2 text-sm text-white/55 transition hover:text-white sm:flex"
          >
            Ver todos os produtos
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} />

        <Link
          href="/produtos"
          className="group mt-8 flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] sm:hidden"
        >
          Ver todos os produtos
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
