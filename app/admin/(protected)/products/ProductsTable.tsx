"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { AdminProduct } from "@/lib/admin/products";
import { toggleProductActiveAction } from "./actions";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function ProductsTable({ products }: { products: AdminProduct[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(product: AdminProduct) {
    const verb = product.isActive ? "desativar" : "ativar";
    const confirmed = window.confirm(
      `Tem certeza que deseja ${verb} "${product.name}"?`,
    );
    if (!confirmed) return;

    setError(null);
    setPendingId(product.id);
    startTransition(async () => {
      const result = await toggleProductActiveAction(
        product.id,
        !product.isActive,
      );
      setPendingId(null);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-white/60">Nenhum produto cadastrado.</p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs tracking-wide text-white/50 uppercase">
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium">Estoque</th>
              <th className="px-4 py-3 font-medium">Destaque</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const rowPending = isPending && pendingId === product.id;

              return (
                <tr
                  key={product.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-3 text-white">{product.name}</td>
                  <td className="px-4 py-3 text-white/70">
                    {product.brand ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {product.category}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {currencyFormatter.format(product.priceCents / 100)}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {product.stockQuantity}
                  </td>
                  <td className="px-4 py-3">
                    {product.isFeatured ? (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">
                        Sim
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.isActive
                          ? "rounded-full border border-white/20 px-2.5 py-1 text-xs text-white"
                          : "rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-xs text-white/40"
                      }
                    >
                      {product.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggle(product)}
                        disabled={rowPending}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {rowPending
                          ? "..."
                          : product.isActive
                            ? "Desativar"
                            : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
