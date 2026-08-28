"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  createProduct,
  updateProduct,
  setProductActive,
  ProductValidationError,
  type ProductInput,
} from "@/lib/admin/products";

export type ToggleProductActiveState = {
  error: string | null;
};

export type ProductFormState = {
  error: string | null;
};

/**
 * Lê os campos comuns ao formulário de criar/editar a partir do FormData.
 * Não valida — só extrai e converte tipos brutos (string -> number/bool);
 * a validação de negócio (obrigatoriedade, slug, preço > 0, etc.) é toda
 * feita em lib/admin/products.ts, para não duplicar a regra em dois
 * lugares.
 */
function parseProductFormData(formData: FormData): ProductInput {
  const specsRaw = formData.get("specs");

  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    brandId: String(formData.get("brandId") ?? "") || null,
    categoryId: String(formData.get("categoryId") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? ""),
    description: String(formData.get("description") ?? ""),
    specs:
      typeof specsRaw === "string"
        ? specsRaw.split("\n")
        : [],
    priceReais: Number(String(formData.get("price") ?? "").replace(",", ".")),
    priceIsProvisional: formData.get("priceIsProvisional") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
  };
}

/**
 * Server Action chamada pelo botão Ativar/Desativar de ProductsTable.
 *
 * requireAdmin() é chamada aqui dentro, sempre — nunca confiar que só foi
 * possível chegar até aqui porque passou pelo proxy/layout: Server
 * Actions podem ser invocadas fora do fluxo de navegação normal.
 */
export async function toggleProductActiveAction(
  productId: string,
  nextIsActive: boolean,
): Promise<ToggleProductActiveState> {
  await requireAdmin();

  if (!productId) {
    return { error: "Produto inválido." };
  }

  try {
    await setProductActive(productId, nextIsActive);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Falha ao atualizar produto.",
    };
  }

  // Revalida a página do dashboard (Server Component que lista os
  // produtos) sem exigir um refresh completo do navegador — o Client
  // Component que chamou esta action re-renderiza com os dados novos.
  revalidatePath("/admin");

  return { error: null };
}

/**
 * Server Action do formulário de criação (app/admin/(protected)/products/new).
 *
 * requireAdmin() é chamada aqui dentro, sempre — nunca confiar que só foi
 * possível chegar até aqui porque passou pelo proxy/layout.
 */
export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const input = parseProductFormData(formData);

  try {
    await createProduct(input);
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return { error: err.message };
    }
    return {
      error: err instanceof Error ? err.message : "Falha ao criar produto.",
    };
  }

  revalidatePath("/admin");
  redirect("/admin");
}

/**
 * Server Action do formulário de edição
 * (app/admin/(protected)/products/[id]/edit). productId chega via
 * `.bind(null, productId)` no Client Component — useActionState não
 * suporta parâmetros extras além de (prevState, formData) diretamente.
 *
 * requireAdmin() é chamada aqui dentro, sempre.
 */
export async function updateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const input = parseProductFormData(formData);

  try {
    await updateProduct(productId, input);
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return { error: err.message };
    }
    return {
      error: err instanceof Error ? err.message : "Falha ao salvar produto.",
    };
  }

  revalidatePath("/admin");
  redirect("/admin");
}
