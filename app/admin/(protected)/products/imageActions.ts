"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  setImagePosition,
  deleteProductImage,
  uploadProductImage,
  ProductValidationError,
  type AdminProductImage,
} from "@/lib/admin/products";

export type ImageActionState = {
  error: string | null;
};

export type UploadImageActionState = {
  error: string | null;
  image: AdminProductImage | null;
};

/**
 * requireAdmin() é chamada aqui dentro, sempre — nunca confiar que só
 * foi possível chegar até aqui porque passou pelo proxy/layout: Server
 * Actions podem ser invocadas fora do fluxo de navegação normal.
 */
export async function updateImagePositionAction(
  productId: string,
  imageId: string,
  position: number,
): Promise<ImageActionState> {
  await requireAdmin();

  try {
    await setImagePosition(productId, imageId, position);
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return { error: err.message };
    }
    return {
      error: err instanceof Error ? err.message : "Falha ao atualizar posição.",
    };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { error: null };
}

/**
 * requireAdmin() é chamada aqui dentro, sempre. `formData` precisa
 * conter um campo "file" com o arquivo (File) — quem chama monta esse
 * FormData no client (ImagesSection.tsx), um arquivo por vez, para poder
 * mostrar o progresso individual de cada upload.
 */
export async function uploadProductImageAction(
  productId: string,
  formData: FormData,
): Promise<UploadImageActionState> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Nenhum arquivo enviado.", image: null };
  }

  let image: AdminProductImage;
  try {
    image = await uploadProductImage(productId, file);
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return { error: err.message, image: null };
    }
    return {
      error: err instanceof Error ? err.message : "Falha ao enviar imagem.",
      image: null,
    };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { error: null, image };
}

export async function deleteProductImageAction(
  productId: string,
  imageId: string,
): Promise<ImageActionState> {
  await requireAdmin();

  try {
    await deleteProductImage(productId, imageId);
  } catch (err) {
    if (err instanceof ProductValidationError) {
      return { error: err.message };
    }
    return {
      error: err instanceof Error ? err.message : "Falha ao remover imagem.",
    };
  }

  revalidatePath(`/admin/products/${productId}/edit`);
  return { error: null };
}
