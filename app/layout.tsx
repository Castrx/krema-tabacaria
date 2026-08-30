import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { MotionConfigProvider } from "@/components/shared/MotionConfigProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_TITLE = "Krema Tabacaria | Tabacaria & Head Shop em Arroio do Sal";
const SITE_DESCRIPTION =
  "Conheça a Krema Tabacaria & Head Shop em Arroio do Sal. Produtos, acessórios e marcas selecionadas.";

// Imagem de OG/Twitter: mesma foto real da loja já usada no Hero da Home
// (public/hero/hero-krema.png) — nenhuma imagem nova foi criada, só
// reaproveitada. Dimensões reais do arquivo, para o preview do
// WhatsApp/Instagram/X não precisar adivinhar o aspect ratio.
const SOCIAL_IMAGE = {
  url: "/hero/hero-krema.png",
  width: 958,
  height: 719,
  alt: "Interior da Krema Tabacaria e Head Shop",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://krema-tabacaria.vercel.app"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "Krema Tabacaria",
    locale: "pt_BR",
    type: "website",
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_IMAGE.url],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionConfigProvider>
          <CartProvider>{children}</CartProvider>
        </MotionConfigProvider>
      </body>
    </html>
  );
}
