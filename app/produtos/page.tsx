import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductsCatalog } from "@/components/product/ProductsCatalog";
import { getAllProducts } from "@/lib/products";

// Só o canonical é definido aqui — title/description/openGraph/twitter
// continuam herdados do RootLayout (mesmo critério de app/page.tsx).
export const metadata: Metadata = {
  alternates: {
    canonical: "/produtos",
  },
};

// Server Component: busca o catálogo no Supabase (lib/products.ts) no
// servidor. Erros de consulta não são capturados aqui de propósito — se
// getAllProducts() lançar, o Next mostra o erro (overlay em dev, log no
// servidor em produção) em vez de esconder a falha atrás de um catálogo
// vazio falso.
export default async function ProdutosPage() {
  const products = await getAllProducts();

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Header />

      <section className="px-5 pb-24 pt-32 md:px-8 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
            Produtos
          </h1>

          <ProductsCatalog products={products} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
