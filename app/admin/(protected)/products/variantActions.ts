"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createVariant,
  updateVariant,
  setVariantActive,
  deleteVariant,
  ProductValidationError,
  type VariantInput,
} from "@/lib/admin/products";

export type VariantFormState = {
  error: string | null;
};

function parseVariantFormData(formData: FormData): VariantInput {
  const positionRaw = String(formData.get("position") ?? "").trim();

  return {
    sku: String(formData.get("sku") ?? ""),
    color: String(formData.get("color") ?? ""),
    model: String(formData.get("model") ?? ""),
    priceReais: String(formData.get("price") ?? ""),
    stockQuantity: Number(formData.get("stockQuantity") ?? 0),
    isActive: formData.get("isActive") === "on",
    position: positionRaw ? Number.parseInt(positionRaw, 10) : null,
  };
}

/**
 * requireAdmin() é chamada aqui dentro, sempre — nunca confiar que só
 * foi possível chegar até aqui porque passou pelo proxy/layout: Server
 * Actions podem ser invocadas fora do fluxo de navegação normal.
 */
export async function createVariantAction(
  productId: string,
  _prevState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  await requireAdmin();

  const input = parseVariantFormData(formData);

  try {
    await createVariant(productId, input);
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return { error: err.message };
    }
    return {
      error: err instanceof Error ? err.message : "Falha ao criar variante.",
    };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { error: null };
}

export async function updateVariantAction(
  variantId: string,
  productId: string,
  _prevState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  await requireAdmin();

  const input = parseVariantFormData(formData);

  try {
    await updateVariant(variantId, productId, input);
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return { error: err.message };
    }
    return {
      error: err instanceof Error ? err.message : "Falha ao salvar variante.",
    };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { error: null };
}

export async function toggleVariantActiveAction(
  variantId: string,
  productId: string,
  nextIsActive: boolean,
): Promise<VariantFormState> {
  await requireAdmin();

  try {
    await setVariantActive(variantId, nextIsActive);
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Falha ao atualizar variante.",
    };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { error: null };
}

export async function deleteVariantAction(
  variantId: string,
  productId: string,
): Promise<VariantFormState> {
  await requireAdmin();

  try {
    await deleteVariant(variantId);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Falha ao remover variante.",
    };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { error: null };
}
