import type { ProductCategory } from "@/data/products";

export type Category = {
  id: ProductCategory;
  label: string;
};

export const categories: Category[] = [
  { id: "cinzeiros", label: "Cinzeiros" },
  { id: "dichavadores", label: "Dichavadores" },
  { id: "isqueiros", label: "Isqueiros" },
  { id: "pipes", label: "Pipes" },
  { id: "bongs", label: "Bongs" },
  { id: "acessorios", label: "Acessórios" },
];
