import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/products";

const SITE_URL = "https://krema-tabacaria.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllProductSlugs();
  const productUrls = slugs.map((slug) => ({
    url: `${SITE_URL}/produtos/${slug}`,
  }));

  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/produtos` },
    ...productUrls,
  ];
}
