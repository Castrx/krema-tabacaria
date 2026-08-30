import type { Metadata } from "next";
import { LegalPagePlaceholder } from "@/components/legal/LegalPagePlaceholder";

// Título/descrição derivados só do nome da própria página — nenhuma
// informação comercial ou jurídica inventada aqui.
export const metadata: Metadata = {
  title: "Política de Privacidade | Krema Tabacaria",
  description: "Política de Privacidade da Krema Tabacaria.",
};

export default function PoliticaDePrivacidadePage() {
  return <LegalPagePlaceholder title="Política de Privacidade" />;
}
