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
    // Detalhe completo só no log do servidor — nunca no corpo da resposta.
    // Esta rota é pública (qualquer origem pode chamá-la), então a
    // mensagem real (que pode incluir detalhe interno do Postgres/Supabase)
    // fica só aqui; o cliente recebe só o genérico abaixo. Status HTTP
    // preservado: 500 continua sendo "falha real de servidor" — um id
    // inexistente nunca cai neste catch, já volta como array vazio.
    console.error("[api/products] Falha ao carregar produtos:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar os produtos." },
      { status: 500 },
    );
  }
}
