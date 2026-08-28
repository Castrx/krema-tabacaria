import Link from "next/link";
import { getAllProductsForAdmin } from "@/lib/admin/products";
import { ProductsTable } from "./products/ProductsTable";

// Server Component — já protegido pelo layout (requireAdmin()), não
// precisa checar autenticação de novo aqui. Leitura via service role
// (ver lib/admin/products.ts) para enxergar produtos ativos E inativos.
export default async function AdminDashboardPage() {
  const products = await getAllProductsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="mt-1 text-sm text-white/60">
            {products.length} produto{products.length === 1 ? "" : "s"}{" "}
            cadastrado{products.length === 1 ? "" : "s"}. Criar, editar,
            ativar/desativar.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Novo produto
        </Link>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
