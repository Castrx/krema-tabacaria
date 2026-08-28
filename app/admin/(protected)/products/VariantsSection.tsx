"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { AdminVariant } from "@/lib/admin/products";
import {
  createVariantAction,
  updateVariantAction,
  toggleVariantActiveAction,
  deleteVariantAction,
} from "./variantActions";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-sm text-white outline-none focus:border-white/30";
const fieldLabelClass = "text-xs text-white/60";

function variantLabel(variant: AdminVariant): string {
  return [variant.color, variant.model].filter(Boolean).join(" / ") || variant.sku;
}

type VariantsSectionProps = {
  productId: string;
  productPriceCents: number;
  variants: AdminVariant[];
};

/**
 * Seção "Variantes" da tela de edição de produto. Client Component: a
 * lista chega via prop (Server Component pai, já protegido por
 * requireAdmin() no layout) e se atualiza sozinha depois de cada
 * mutação porque as Server Actions chamam revalidatePath() na própria
 * rota — mesmo padrão já usado em ProductsTable para ativar/desativar
 * produto.
 */
export function VariantsSection({
  productId,
  productPriceCents,
  variants,
}: VariantsSectionProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <section className="space-y-4 rounded-xl border border-white/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Variantes</h2>
          <p className="text-sm text-white/50">
            Cor/modelo, estoque e preço por variante. Ainda não usado na
            venda pública.
          </p>
        </div>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white"
          >
            + Adicionar variante
          </button>
        )}
      </div>

      {variants.length === 0 && !addingNew && (
        <p className="text-sm text-white/40">Nenhuma variante cadastrada.</p>
      )}

      {variants.length > 0 && (
        <ul className="space-y-2">
          {variants.map((variant) => (
            <li key={variant.id}>
              {editingId === variant.id ? (
                <VariantForm
                  mode="edit"
                  productId={productId}
                  productPriceCents={productPriceCents}
                  variant={variant}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <VariantRow
                  variant={variant}
                  productId={productId}
                  productPriceCents={productPriceCents}
                  onEdit={() => setEditingId(variant.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {addingNew && (
        <VariantForm
          mode="create"
          productId={productId}
          productPriceCents={productPriceCents}
          onDone={() => setAddingNew(false)}
        />
      )}
    </section>
  );
}

function VariantRow({
  variant,
  productId,
  productPriceCents,
  onEdit,
}: {
  variant: AdminVariant;
  productId: string;
  productPriceCents: number;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const verb = variant.isActive ? "desativar" : "ativar";
    if (
      !window.confirm(
        `Tem certeza que deseja ${verb} a variante "${variantLabel(variant)}"?`,
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await toggleVariantActiveAction(
        variant.id,
        productId,
        !variant.isActive,
      );
      if (result.error) setError(result.error);
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Remover definitivamente a variante "${variantLabel(variant)}"? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteVariantAction(variant.id, productId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-medium text-white">{variant.sku}</span>
        <span className="text-white/60">
          {[variant.color, variant.model].filter(Boolean).join(" / ") || "—"}
        </span>
        <span className="text-white/60">
          {variant.priceCents !== null
            ? currencyFormatter.format(variant.priceCents / 100)
            : `herda (${currencyFormatter.format(productPriceCents / 100)})`}
        </span>
        <span className="text-white/60">Estoque: {variant.stockQuantity}</span>
        {variant.position !== null && (
          <span className="text-white/40">Pos. {variant.position}</span>
        )}
        <span
          className={
            variant.isActive
              ? "rounded-full border border-white/20 px-2.5 py-1 text-xs text-white"
              : "rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-xs text-white/40"
          }
        >
          {variant.isActive ? "Ativa" : "Inativa"}
        </span>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {variant.isActive ? "Desativar" : "Ativar"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function VariantForm({
  mode,
  productId,
  productPriceCents,
  variant,
  onDone,
}: {
  mode: "create" | "edit";
  productId: string;
  productPriceCents: number;
  variant?: AdminVariant;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result =
        mode === "edit" && variant
          ? await updateVariantAction(
              variant.id,
              productId,
              { error: null },
              formData,
            )
          : await createVariantAction(productId, { error: null }, formData);

      if (result.error) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-white/15 bg-white/[0.03] p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor={`sku-${variant?.id ?? "new"}`} className={fieldLabelClass}>
            SKU
          </label>
          <input
            id={`sku-${variant?.id ?? "new"}`}
            name="sku"
            defaultValue={variant?.sku}
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`color-${variant?.id ?? "new"}`} className={fieldLabelClass}>
            Cor
          </label>
          <input
            id={`color-${variant?.id ?? "new"}`}
            name="color"
            defaultValue={variant?.color ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`model-${variant?.id ?? "new"}`} className={fieldLabelClass}>
            Modelo
          </label>
          <input
            id={`model-${variant?.id ?? "new"}`}
            name="model"
            defaultValue={variant?.model ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`price-${variant?.id ?? "new"}`} className={fieldLabelClass}>
            Preço (R$) — vazio herda{" "}
            {currencyFormatter.format(productPriceCents / 100)}
          </label>
          <input
            id={`price-${variant?.id ?? "new"}`}
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={
              variant?.priceCents != null
                ? (variant.priceCents / 100).toFixed(2)
                : ""
            }
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor={`stockQuantity-${variant?.id ?? "new"}`}
            className={fieldLabelClass}
          >
            Estoque
          </label>
          <input
            id={`stockQuantity-${variant?.id ?? "new"}`}
            name="stockQuantity"
            type="number"
            step="1"
            min="0"
            defaultValue={variant?.stockQuantity ?? 0}
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`position-${variant?.id ?? "new"}`} className={fieldLabelClass}>
            Posição (opcional)
          </label>
          <input
            id={`position-${variant?.id ?? "new"}`}
            name="position"
            type="number"
            step="1"
            defaultValue={variant?.position ?? ""}
            className={fieldClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={variant?.isActive ?? true}
          className="size-4 rounded border-white/20 bg-black"
        />
        Ativa
      </label>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Salvando..." : mode === "create" ? "Adicionar" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
