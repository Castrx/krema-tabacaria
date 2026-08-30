import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductAddToCart } from "@/components/product/ProductAddToCart";
import {
  ProductImagePlaceholder,
  resolveProductImageUrl,
} from "@/components/product/ProductImagePlaceholder";
import { categories } from "@/data/categories";
import { getAllProductSlugs, getProductBySlug } from "@/lib/products";

type ProductPageParams = { slug: string };

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Mesma foto real da loja usada no OG padrão do site (app/layout.tsx) —
// fallback só para o caso raro de um produto sem nenhuma imagem cadastrada,
// nunca inventa arte nova.
const FALLBACK_SOCIAL_IMAGE = "/hero/hero-krema.png";

export async function generateMetadata({
  params,
}: {
  params: Promise<ProductPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produto não encontrado | Krema Tabacaria",
    };
  }

  const title = `${product.name} | Krema Tabacaria`;
  const description = product.shortDescription;
  const canonicalPath = `/produtos/${slug}`;
  // Mesma regra usada para renderizar a imagem principal na própria página
  // (ver <Image>/<ProductImagePlaceholder> abaixo) — nunca resolve de novo
  // aqui. null (produto sem nenhuma imagem cadastrada) cai no fallback do
  // site, nunca numa URL vazia.
  const socialImage = resolveProductImageUrl(product) ?? FALLBACK_SOCIAL_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "Krema Tabacaria",
      locale: "pt_BR",
      type: "website",
      images: [{ url: socialImage, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<ProductPageParams>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = categories.find((c) => c.id === product.category);
  const imageUrl = resolveProductImageUrl(product);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Header />

      <section className="px-5 pb-24 pt-32 md:px-8 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/produtos"
            className="group inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white"
          >
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Voltar ao catálogo
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Imagem */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#111]">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <ProductImagePlaceholder className="absolute inset-0" />
              )}

              {product.priceIsProvisional && (
                <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/70 backdrop-blur-md">
                  Preço demonstrativo
                </span>
              )}
            </div>

            {/* Informações */}
            <div className="flex flex-col">
              {category && (
                <span className="text-xs uppercase tracking-[0.2em] text-white/40">
                  {category.label}
                </span>
              )}

              {product.brand && (
                <span className="mt-3 block text-sm uppercase tracking-[0.2em] text-white/50">
                  {product.brand}
                </span>
              )}

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
                {product.name}
              </h1>

              <p className="mt-6 text-sm leading-7 text-white/60 md:text-base">
                {product.shortDescription}
              </p>

              <p className="mt-4 text-sm leading-7 text-white/50">
                {product.description}
              </p>

              {product.specs && product.specs.length > 0 && (
                <ul className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-5">
                  {product.specs.map((spec) => (
                    <li
                      key={spec}
                      className="flex items-start gap-2 text-sm text-white/50"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-white/30" />
                      {spec}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8">
                <ProductAddToCart product={product} />
              </div>

              <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/30">
                Preços demonstrativos
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
