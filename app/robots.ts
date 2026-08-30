import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Painel administrativo — nunca deve ser indexado (login e dashboard
      // já são bloqueados de verdade por proxy.ts + requireAdmin(); isto é
      // só a instrução de crawling para os buscadores).
      disallow: "/admin",
    },
    sitemap: "https://krema-tabacaria.vercel.app/sitemap.xml",
  };
}
