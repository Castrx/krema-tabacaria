import { AboutKrema } from "@/components/home/AboutKrema";
import { Brands } from "@/components/home/Brands";
import { Categories } from "@/components/home/Categories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { InstagramPreview } from "@/components/home/InstagramPreview";
import { Location } from "@/components/home/Location";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Header />

      <Hero />

      <Categories />

      <FeaturedProducts />

      <Brands />

      <AboutKrema />

      <Location />

      <InstagramPreview />

      <Footer />
    </main>
  );
}