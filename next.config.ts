import type { NextConfig } from "next";

// Headers de segurança básicos, aplicados a todo o site (público + admin).
// Escopo desta etapa é só o "razoável e simples" — sem CSP (fica para uma
// etapa própria, exige mapear todo script/estilo/imagem externo usado).
const SECURITY_HEADERS = [
  // Navegador nunca deve tentar adivinhar o Content-Type de uma resposta —
  // evita um arquivo enviado como texto/imagem ser executado como script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nunca manda a URL completa de origem em navegação cross-origin, e não
  // manda nada ao degradar de HTTPS para HTTP — só a origem em navegação
  // cross-origin sobre HTTPS, e a URL completa em navegação same-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // SAMEORIGIN (não DENY): nada no site depende de ser exibido dentro de um
  // <iframe> de terceiros — isto bloqueia esse cenário (clickjacking) sem
  // quebrar nada same-origin. Não afeta o <iframe> do Google Maps embutido
  // em Location.tsx: X-Frame-Options controla quem pode enquadrar ESTE
  // site, não o que este site pode enquadrar.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Nega de saída as APIs de navegador que o site nunca usa (nenhum
  // componente pede câmera, microfone, geolocalização ou Payment Request —
  // o checkout é só o link do WhatsApp).
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
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
