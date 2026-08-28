"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { filterProducts } from "@/components/product/ProductSearch";
import { categories } from "@/data/categories";
import type { Product, ProductCategory } from "@/types/product";
import { cn } from "@/lib/utils";

type FilterValue = "todos" | ProductCategory;

/**
 * Filtro de categoria + busca + grid da página /produtos. Recebe o catálogo
 * já carregado (hoje via Supabase, em app/produtos/page.tsx) como prop —
 * filtro e busca continuam 100% client-side, exatamente como antes da
 * migração, reaproveitando `filterProducts` sem duplicar a lógica.
 */
export function ProductsCatalog({ products }: { products: Product[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");
  const [query, setQuery] = useState("");

  const productsByCategory = useMemo(() => {
    if (activeFilter === "todos") return products;

    return products.filter((product) => product.category === activeFilter);
  }, [products, activeFilter]);

  const filteredProducts = useMemo(
    () => filterProducts(productsByCategory, query),
    [productsByCategory, query],
  );

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 md:mt-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
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

        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por produto ou marca..."
            aria-label="Buscar produtos"
            className="w-full rounded-full border border-white/15 bg-white/[0.03] py-2.5 pl-10 pr-9 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/30 focus:bg-white/[0.06]"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-white/40 transition hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-10 md:mt-12">
        <ProductGrid products={filteredProducts} />
      </div>
    </>
  );
}
