export type ProductCategory =
  | "cinzeiros"
  | "dichavadores"
  | "isqueiros"
  | "acessorios"
  | "pipes"
  | "bongs";

export type Product = {
  id: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  image: string;
  description: string;
  specs?: string[];
  verified: boolean;
};

export const products: Product[] = [
  {
    id: "cinzeiro-squadafum-quadrado",
    name: "Cinzeiro Quadrado Squadafum",
    brand: "Squadafum",
    category: "cinzeiros",
    image: "/products/cinzeiro-squadafum-quadrado-tie-dye.jpeg",
    description:
      "Cinzeiro quadrado de silicone em visual colorido. A foto enviada mostra uma versão tie-dye e uma versão turquesa.",
    specs: [
      "Silicone",
      "Modelo quadrado",
      "Aproximadamente 10 cm de diâmetro",
      "Aproximadamente 3 cm de altura",
      "Resistente a altas temperaturas",
    ],
    verified: true,
  },
  {
    id: "kit-acessorios-case",
    name: "Kit de Acessórios com Case",
    category: "acessorios",
    image: "/products/kit-acessorios-case.jpeg",
    description:
      "Kit fotografado pela Krema com case, cuia, tesoura, seda RAW Classic e isqueiro.",
    specs: [
      "Case com zíper",
      "Cuia de silicone",
      "Tesoura dobrável",
      "Seda RAW Classic",
      "Isqueiro",
    ],
    verified: false,
  },
  {
    id: "firestar-mini-torch",
    name: "Isqueiro Maçarico Firestar",
    brand: "Firestar",
    category: "isqueiros",
    image: "/products/isqueiros-firestar-mini-torch.jpeg",
    description:
      "Isqueiro maçarico Firestar compacto, fotografado em diferentes cores.",
    specs: [
      "Marca Firestar",
      "Acendimento tipo maçarico",
      "Formato compacto",
      "Cores variadas",
    ],
    verified: true,
  },
  {
    id: "sadhu-black-edition",
    name: "Dichavador Sadhu Black Edition",
    brand: "Sadhu",
    category: "dichavadores",
    image: "/products/dichavador-sadhu-black-edition.jpeg",
    description:
      "Dichavador metálico Sadhu Black Edition de quatro partes.",
    specs: [
      "Metal",
      "4 partes",
      "Modelo Black Edition",
      "Diâmetro aproximado de 6,3 cm",
      "Altura aproximada de 4,4 cm",
    ],
    verified: true,
  },
  {
    id: "pipe-silicone-amarelo",
    name: "Pipe de Silicone Amarelo",
    category: "pipes",
    image: "/products/pipe-silicone-amarelo.jpeg",
    description:
      "Pipe de silicone amarelo com haste metálica, conforme fotografia enviada pela Krema.",
    specs: [
      "Silicone",
      "Haste metálica",
      "Cor amarela",
    ],
    verified: false,
  },
  {
    id: "cinzeiro-tonabe-hype",
    name: "Cinzeiro To NaBê Hype",
    brand: "To NaBê",
    category: "cinzeiros",
    image: "/products/cinzeiro-tonabe-hype.jpeg",
    description:
      "Cinzeiro de mesa com arte Hype, identificado visualmente como To NaBê.",
    specs: [
      "Cinzeiro de mesa",
      "Arte Hype",
      "Acabamento colorido",
    ],
    verified: false,
  },
  {
    id: "bong-colter-laranja",
    name: "Bong de Vidro Colter — Laranja",
    brand: "Colter",
    category: "bongs",
    image: "/products/bong-vidro-colter-laranja.jpeg",
    description:
      "Bong de vidro com detalhes gráficos em laranja, identificado pela marca visível na peça.",
    specs: [
      "Vidro",
      "Detalhes gráficos em laranja",
      "Peça fotografada individualmente",
    ],
    verified: false,
  },
  {
    id: "firestar-planet-signos",
    name: "Isqueiro Maçarico Firestar Planet Signos",
    brand: "Firestar",
    category: "isqueiros",
    image: "/products/isqueiro-firestar-planet-signos.jpeg",
    description:
      "Isqueiro maçarico Firestar Planet com estampas inspiradas nos signos do zodíaco.",
    specs: [
      "Marca Firestar",
      "Modelo Planet Signos",
      "Recarregável",
      "Chama tipo maçarico",
      "Estampas de signos",
    ],
    verified: true,
  },
  {
    id: "worldfire-emborrachado",
    name: "Maçarico Worldfire Emborrachado",
    brand: "Worldfire",
    category: "isqueiros",
    image: "/products/macarico-worldfire-emborrachado.jpeg",
    description:
      "Maçarico emborrachado fotografado em três cores pela Krema.",
    specs: [
      "Acabamento emborrachado",
      "Cores azul, amarelo e roxo na fotografia",
    ],
    verified: false,
  },
];
