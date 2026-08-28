"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { AdminOption, AdminProductDetail } from "@/lib/admin/products";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "./actions";

type ProductFormProps = {
  mode: "create" | "edit";
  product?: AdminProductDetail;
  brands: AdminOption[];
  categories: AdminOption[];
};

const initialState: ProductFormState = { error: null };

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-white/30";
const labelClass = "text-sm text-white/70";
const checkboxRowClass = "flex items-center gap-2 text-sm text-white/80";

export function ProductForm({
  mode,
  product,
  brands,
  categories,
}: ProductFormProps) {
  const action =
    mode === "edit" && product
      ? updateProductAction.bind(null, product.id)
      : createProductAction;

  const [state, formAction, isPending] = useActionState(
    action,
    initialState,
  );

  // Auto-preenche o slug a partir do nome, só na criação e só enquanto o
  // admin ainda não digitou nada no campo slug — evita sobrescrever uma
  // edição manual.
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [slugValue, setSlugValue] = useState(product?.slug ?? "");

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="name" className={labelClass}>
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name}
            onChange={(event) => {
              if (!slugTouched) {
                setSlugValue(slugify(event.target.value));
              }
            }}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="slug" className={labelClass}>
            Slug (usado na URL pública — só letras minúsculas, números e
            hífen)
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slugValue}
            onChange={(event) => {
              setSlugTouched(true);
              setSlugValue(event.target.value);
            }}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="brandId" className={labelClass}>
            Marca
          </label>
          <select
            id="brandId"
            name="brandId"
            defaultValue={product?.brandId ?? ""}
            className={inputClass}
          >
            <option value="">— nenhuma —</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="categoryId" className={labelClass}>
            Categoria
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={product?.categoryId ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="price" className={labelClass}>
            Preço (R$)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={
              product ? (product.priceCents / 100).toFixed(2) : undefined
            }
            className={inputClass}
          />
        </div>

        <div className="flex items-end">
          <label className={checkboxRowClass}>
            <input
              type="checkbox"
              name="priceIsProvisional"
              defaultChecked={product?.priceIsProvisional ?? true}
              className="size-4 rounded border-white/20 bg-black"
            />
            Preço demonstrativo (ainda não é o valor real)
          </label>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="shortDescription" className={labelClass}>
            Descrição curta
          </label>
          <input
            id="shortDescription"
            name="shortDescription"
            type="text"
            required
            defaultValue={product?.shortDescription}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Descrição completa
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={5}
            defaultValue={product?.description}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="specs" className={labelClass}>
            Especificações (uma por linha, opcional)
          </label>
          <textarea
            id="specs"
            name="specs"
            rows={4}
            defaultValue={product?.specs.join("\n")}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-6 sm:col-span-2">
          <label className={checkboxRowClass}>
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.isFeatured ?? false}
              className="size-4 rounded border-white/20 bg-black"
            />
            Destaque
          </label>
          <label className={checkboxRowClass}>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product?.isActive ?? true}
              className="size-4 rounded border-white/20 bg-black"
            />
            Ativo
          </label>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Salvando..."
            : mode === "create"
              ? "Criar produto"
              : "Salvar alterações"}
        </button>
        <Link
          href="/admin"
          className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
