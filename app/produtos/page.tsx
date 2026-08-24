"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductGrid } from "@/components/product/ProductGrid";
import { products, type ProductCategory } from "@/data/products";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

type FilterValue = "todos" | ProductCategory;

export default function ProdutosPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");

  const filteredProducts = useMemo(() => {
    if (activeFilter === "todos") return products;

    return products.filter((product) => product.category === activeFilter);
  }, [activeFilter]);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Header />

      <section className="px-5 pb-24 pt-32 md:px-8 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
            Produtos
          </h1>

          <div className="mt-8 flex flex-wrap gap-2 md:mt-10">
            <button
              type="button"
              onClick={() => setActiveFilter("todos")}
              aria-pressed={activeFilter === "todos"}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                activeFilter === "todos"
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              Todos
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveFilter(category.id)}
                aria-pressed={activeFilter === category.id}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  activeFilter === category.id
                    ? "border-white bg-white text-black"
                    : "border-white/15 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="mt-10 md:mt-12">
            <ProductGrid products={filteredProducts} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
