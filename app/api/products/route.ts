import { NextResponse } from "next/server";
import { getAllProducts, getProductsByIds } from "@/lib/products";

/** Nenhum carrinho real da Krema referencia mais que algumas dezenas de
 * produtos distintos — limite generoso só para recusar um `ids=` absurdo
 * (milhares de entradas forçando um IN (...) enorme contra o Supabase)
 * antes de gastar qualquer trabalho de servidor/banco com ele. */
const MAX_IDS = 100;

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
    let products;
    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, MAX_IDS);
      products = await getProductsByIds(ids);
    } else {
      products = await getAllProducts();
    }

    // Dado público, igual para todo mundo, muda pouco de um minuto para
    // o outro — cacheável em CDN/proxy sem risco de servir dado
    // desatualizado por muito tempo. s-maxage é o que importa para
    // cache compartilhado (CDN); stale-while-revalidate evita que um
    // pico de tráfego logo após a expiração espere a resposta nova.
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
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
