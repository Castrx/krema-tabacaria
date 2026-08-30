import type { Metadata } from "next";
import { LegalPagePlaceholder } from "@/components/legal/LegalPagePlaceholder";

// Título/descrição derivados só do nome da própria página — nenhuma
// informação comercial ou jurídica inventada aqui.
export const metadata: Metadata = {
  title: "Trocas e Devoluções | Krema Tabacaria",
  description: "Política de Trocas e Devoluções da Krema Tabacaria.",
};

export default function TrocasEDevolucoesPage() {
  return <LegalPagePlaceholder title="Trocas e Devoluções" />;
}
