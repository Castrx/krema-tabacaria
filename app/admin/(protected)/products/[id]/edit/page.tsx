import { notFound } from "next/navigation";
import {
  getBrandsForAdmin,
  getCategoriesForAdmin,
  getProductForEdit,
  getVariantsForProduct,
} from "@/lib/admin/products";
import { ProductForm } from "../../ProductForm";
import { VariantsSection } from "../../VariantsSection";

// Protegido pelo layout (requireAdmin()) — não precisa checar de novo
// aqui, só as Server Actions de escrita (updateProductAction,
// create/update/toggle/deleteVariantAction) precisam.
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, brands, categories, variants] = await Promise.all([
    getProductForEdit(id),
    getBrandsForAdmin(),
    getCategoriesForAdmin(),
    getVariantsForProduct(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar produto</h1>
        <p className="mt-1 text-sm text-white/60">{product.name}</p>
      </div>

      <ProductForm
        mode="edit"
        product={product}
        brands={brands}
        categories={categories}
      />

      <VariantsSection
        productId={product.id}
        productPriceCents={product.priceCents}
        variants={variants}
      />
    </div>
  );
}
