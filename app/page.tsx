import type { Metadata } from "next";
import { AboutKrema } from "@/components/home/AboutKrema";
import { Brands } from "@/components/home/Brands";
import { Categories } from "@/components/home/Categories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { InstagramPreview } from "@/components/home/InstagramPreview";
import { Location } from "@/components/home/Location";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { getFeaturedProducts } from "@/lib/products";

// Só o canonical é definido aqui — title/description/openGraph/twitter
// continuam vindo do metadata do RootLayout (app/layout.tsx), que já
// descreve a Home corretamente; Next faz merge raso entre os dois, então
// só a chave `alternates` é substituída, o resto é herdado.
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Header />

      <Hero />

      <Categories />

      <FeaturedProducts products={featuredProducts} />

      <Brands />

      <AboutKrema />

      <Location />

      <InstagramPreview />

      <Footer />
    </main>
  );
}