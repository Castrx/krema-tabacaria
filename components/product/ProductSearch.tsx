"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProductQuickView } from "@/components/product/ProductQuickView";
import {
  ProductImagePlaceholder,
  resolveProductImageUrl,
} from "@/components/product/ProductImagePlaceholder";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Remove acentos para a busca não depender de o usuário digitar exatamente
// como está escrito (ex.: "nabe" também encontra "To NaBê").
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * Filtra produtos por nome ou marca. Fonte única da lógica de busca —
 * reutilizada tanto pelo overlay de busca do Header quanto pela página
 * /produtos, para não duplicar o critério de correspondência.
 */
export function filterProducts(products: Product[], query: string): Product[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return products;

  return products.filter((product) => {
    const haystack = normalize(`${product.name} ${product.brand ?? ""}`);
    return haystack.includes(normalizedQuery);
  });
}

type CatalogState = "idle" | "loading" | "error" | "ready";

export function ProductSearchButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Catálogo vem do Supabase via /api/products (Client Component não
  // acessa o Supabase nem lib/products.ts diretamente). Carregado uma
  // única vez na primeira abertura da busca, não a cada tecla digitada, e
  // reaproveitado nas aberturas seguintes.
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>("idle");
  const hasRequestedCatalog = useRef(false);

  useEffect(() => {
    if (!open || hasRequestedCatalog.current) return;
    hasRequestedCatalog.current = true;
    setCatalogState("loading");

    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? `Falha ao carregar produtos (${response.status})`);
        }
        return response.json() as Promise<{ products: Product[] }>;
      })
      .then(({ products }) => {
        setCatalog(products);
        setCatalogState("ready");
      })
      .catch((error) => {
        console.error("[ProductSearch] Falha ao carregar catálogo:", error);
        // Permite tentar de novo numa próxima abertura em vez de travar
        // para sempre num estado de erro.
        hasRequestedCatalog.current = false;
        setCatalogState("error");
      });
  }, [open]);

  const results = useMemo(() => filterProducts(catalog, query), [catalog, query]);

  useEffect(() => {
    if (!open) return;

    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const handleSelect = (product: Product) => {
    setOpen(false);
    setQuery("");
    // pequeno atraso para o sheet de busca fechar antes de abrir o quick view
    window.setTimeout(() => setActiveProduct(product), 200);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Pesquisar produtos"
        className={cn(
          "rounded-full p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white",
          className,
        )}
      >
        <Search className="size-5" />
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="top"
          showCloseButton={false}
          className="max-h-[85vh] border-white/10 bg-[#0b0b0b] text-white"
        >
          <SheetHeader className="flex-row items-center gap-3 border-b border-white/10">
            <SheetTitle className="sr-only">Pesquisar produtos</SheetTitle>

            <Search className="size-4 shrink-0 text-white/40" />

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por produto ou marca..."
              aria-label="Buscar produtos"
              className="w-full bg-transparent text-base text-white placeholder:text-white/35 outline-none"
            />

            <SheetClose
              aria-label="Fechar busca"
              className="shrink-0 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </SheetClose>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {catalogState === "loading" || catalogState === "idle" ? (
              <p className="py-12 text-center text-sm text-white/45">
                Carregando produtos...
              </p>
            ) : catalogState === "error" ? (
              <p className="py-12 text-center text-sm text-white/45">
                Não foi possível carregar os produtos. Tente novamente.
              </p>
            ) : results.length === 0 ? (
              <p className="py-12 text-center text-sm text-white/45">
                Nenhum produto encontrado.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 py-2">
                {results.map((product) => {
                  const imageUrl = resolveProductImageUrl(product);
                  return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(product)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.06]"
                    >
                      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-[#141414]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ProductImagePlaceholder className="h-full w-full" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {product.brand && (
                          <span className="block text-[10px] uppercase tracking-[0.16em] text-white/40">
                            {product.brand}
                          </span>
                        )}
                        <span className="block truncate text-sm font-medium text-white">
                          {product.name}
                        </span>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-white/80">
                        {currencyFormatter.format(product.price)}
                      </span>
                    </button>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {activeProduct && (
        <ProductQuickView
          product={activeProduct}
          open={Boolean(activeProduct)}
          onOpenChange={(next) => {
            if (!next) setActiveProduct(null);
          }}
        />
      )}
    </>
  );
}
