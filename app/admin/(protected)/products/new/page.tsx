import { getBrandsForAdmin, getCategoriesForAdmin } from "@/lib/admin/products";
import { ProductForm } from "../ProductForm";

// Protegido pelo layout (requireAdmin()) — não precisa checar de novo
// aqui, só a Server Action de escrita (createProductAction) precisa.
export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    getBrandsForAdmin(),
    getCategoriesForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo produto</h1>
        <p className="mt-1 text-sm text-white/60">
          Fase 1 do CRUD: sem variantes, sem upload de imagem — imagens
          continuam sendo cadastradas fora do painel por enquanto.
        </p>
      </div>

      <ProductForm mode="create" brands={brands} categories={categories} />
    </div>
  );
}
