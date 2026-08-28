import { NextResponse } from "next/server";
import { getAllProducts, getProductsByIds } from "@/lib/products";

/**
 * GET /api/products
 * GET /api/products?ids=slug-a,slug-b
 *
 * Única porta de entrada para Client Components lerem o catálogo do
 * Supabase — eles nunca chamam lib/products.ts (server-only) nem o
 * Supabase diretamente. Usa apenas lib/products.ts, que usa a anon key via
 * lib/supabase/server.ts e respeita RLS; SUPABASE_SERVICE_ROLE_KEY nunca é
 * usada aqui. Só devolve dados públicos do catálogo (o mesmo que
 * getAllProducts/getProductsByIds já expõem para o server).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");

  try {
    const products = idsParam
      ? await getProductsByIds(
          idsParam
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        )
      : await getAllProducts();

    return NextResponse.json({ products });
  } catch (error) {
    // Não esconde o erro: devolve a mensagem real para o cliente poder
    // diagnosticar, em vez de um catálogo vazio disfarçado de sucesso.
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
