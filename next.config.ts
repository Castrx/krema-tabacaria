import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Libera só o Storage público de imagens de produto do projeto
    // Supabase usado por este app — hostname exato (nunca um wildcard
    // *.supabase.co) e pathname restrito ao bucket product-images,
    // exatamente o que lib/admin/products.ts grava em product_images.url.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lladorfxytgtadzevwpa.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/product-images/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
