"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "@/types/product";
import { ProductGrid } from "@/components/product/ProductGrid";

// Destaques resolvidos no servidor (app/page.tsx) via getFeaturedProducts()
// — is_featured no Supabase é a fonte de verdade, não uma lista de ids
// hardcoded aqui.
export function FeaturedProducts({ products }: { products: Product[] }) {
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

        <ProductGrid products={products} />

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
