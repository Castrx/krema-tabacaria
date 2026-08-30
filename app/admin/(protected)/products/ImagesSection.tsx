"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import type { AdminProductImage } from "@/lib/admin/products";
import {
  updateImagePositionAction,
  deleteProductImageAction,
  uploadProductImageAction,
} from "./imageActions";

type ImagesSectionProps = {
  productId: string;
  images: AdminProductImage[];
};

// Mesmas regras validadas de verdade no servidor (lib/admin/products.ts)
// — checadas aqui só pra dar feedback imediato antes de gastar uma
// requisição; nunca são a fonte de verdade.
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

type UploadQueueItem = {
  key: string;
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Seção "Imagens" da tela de edição de produto. Lista atualiza sozinha
 * depois de cada mutação porque as Server Actions chamam revalidatePath()
 * na própria rota — mesmo padrão de VariantsSection/ProductsTable.
 *
 * Upload: um arquivo por vez (sequencial, mesmo selecionando vários de
 * uma vez), pra dar feedback individual de progresso/erro sem duas
 * chamadas concorrentes disputando a mesma "próxima posição" no mesmo
 * produto. Sem edição/compressão — o arquivo vai pro Storage como foi
 * enviado, só validado (tipo/tamanho) e renomeado no servidor.
 */
export function ImagesSection({ productId, images }: ImagesSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Rascunho local do campo de posição por imagem — só existe enquanto o
  // admin ainda não salvou; depois de salvar, o valor volta a vir de
  // `images` (já renumerado pelo servidor).
  const [positionDrafts, setPositionDrafts] = useState<Record<string, string>>(
    {},
  );

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSavePosition(image: AdminProductImage) {
    const raw = positionDrafts[image.id];
    const parsed = raw === undefined ? image.position : Number.parseInt(raw, 10);

    if (!Number.isInteger(parsed) || parsed < 0) {
      setError("Posição inválida — use um número inteiro maior ou igual a zero.");
      return;
    }

    setError(null);
    setPendingId(image.id);
    startTransition(async () => {
      const result = await updateImagePositionAction(productId, image.id, parsed);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
      } else {
        setPositionDrafts((prev) => {
          const next = { ...prev };
          delete next[image.id];
          return next;
        });
      }
    });
  }

  function handleRemove(image: AdminProductImage) {
    if (
      !window.confirm(
        `Remover esta imagem (posição ${image.position})? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setError(null);
    setPendingId(image.id);
    startTransition(async () => {
      const result = await deleteProductImageAction(productId, image.id);
      setPendingId(null);
      if (result.error) setError(result.error);
    });
  }

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    // Limpa o input já aqui — permite selecionar o mesmo arquivo de novo
    // depois (ex.: reenviar após corrigir um erro).
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    setError(null);
    setIsUploading(true);
    setUploadQueue(
      files.map((file, index) => ({
        key: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        status: "uploading",
      })),
    );

    // Sequencial de propósito: cada upload precisa do estado (posição)
    // que o upload anterior já gravou, e assim o admin vê o progresso
    // arquivo por arquivo em vez de tudo terminando de uma vez.
    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setUploadQueue((prev) =>
          prev.map((item, i) =>
            i === index
              ? { ...item, status: "error", error: "Formato não suportado" }
              : item,
          ),
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadQueue((prev) =>
          prev.map((item, i) =>
            i === index
              ? { ...item, status: "error", error: "Arquivo maior que 5MB" }
              : item,
          ),
        );
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      // Sequencial de propósito (ver comentário da função) — cada
      // arquivo espera o anterior terminar.
      const result = await uploadProductImageAction(productId, formData);

      setUploadQueue((prev) =>
        prev.map((item, i) =>
          i === index
            ? result.error
              ? { ...item, status: "error", error: result.error }
              : { ...item, status: "done" }
            : item,
        ),
      );
      if (result.error) setError(result.error);
    }

    setIsUploading(false);
  }

  return (
    <section className="space-y-4 rounded-xl border border-white/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Imagens</h2>
          <p className="text-sm text-white/50">
            Posição 0 é a imagem principal. PNG, JPEG, WebP ou AVIF, até 5MB
            por arquivo.
          </p>
        </div>

        <label className="rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.06] hover:text-white cursor-pointer">
          {isUploading ? "Enviando..." : "+ Enviar imagens"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            multiple
            disabled={isUploading}
            onChange={handleFilesSelected}
            className="hidden"
          />
        </label>
      </div>

      {uploadQueue.length > 0 && (
        <ul className="space-y-1">
          {uploadQueue.map((item) => (
            <li
              key={item.key}
              className={
                item.status === "error"
                  ? "text-xs text-red-400"
                  : item.status === "done"
                    ? "text-xs text-white/40"
                    : "text-xs text-white/70"
              }
            >
              {item.status === "uploading" && "Enviando "}
              {item.status === "done" && "Enviado "}
              {item.status === "error" && "Falhou "}
              {item.name}
              {item.error ? ` — ${item.error}` : ""}
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-white/40">Nenhuma imagem cadastrada.</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {images.map((image) => {
            const rowPending = isPending && pendingId === image.id;
            const draftValue = positionDrafts[image.id] ?? String(image.position);

            return (
              <li
                key={image.id}
                className="flex w-36 flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-[#141414]">
                  <Image
                    src={image.url}
                    alt={image.altText ?? ""}
                    fill
                    sizes="144px"
                    unoptimized={isAbsoluteUrl(image.url)}
                    className="object-cover"
                  />
                  {image.position === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-black">
                      Principal
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor={`image-position-${image.id}`}
                    className="text-[11px] text-white/50"
                  >
                    Pos.
                  </label>
                  <input
                    id={`image-position-${image.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={draftValue}
                    onChange={(event) =>
                      setPositionDrafts((prev) => ({
                        ...prev,
                        [image.id]: event.target.value,
                      }))
                    }
                    className="w-14 rounded-md border border-white/10 bg-black px-1.5 py-1 text-xs text-white outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => handleSavePosition(image)}
                    disabled={rowPending}
                    className="flex-1 rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/80 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {rowPending ? "..." : "Salvar"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(image)}
                  disabled={rowPending}
                  className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remover
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
