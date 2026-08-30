import type { Metadata } from "next";
import { LegalPagePlaceholder } from "@/components/legal/LegalPagePlaceholder";

// Título/descrição derivados só do nome da própria página — nenhuma
// informação comercial ou jurídica inventada aqui.
export const metadata: Metadata = {
  title: "Termos de Uso | Krema Tabacaria",
  description: "Termos de Uso da Krema Tabacaria.",
};

export default function TermosDeUsoPage() {
  return <LegalPagePlaceholder title="Termos de Uso" />;
}
