export type ProductCategory =
  | "cinzeiros"
  | "dichavadores"
  | "isqueiros"
  | "acessorios"
  | "pipes"
  | "bongs";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  image: string;
  images: string[];
  /**
   * Preço demonstrativo, usado apenas para a apresentação da V2 ao cliente.
   * NÃO representa o valor real cobrado pela Krema.
   */
  price: number;
  priceIsProvisional: boolean;
  shortDescription: string;
  description: string;
  specs?: string[];
  verified: boolean;
};

export const products: Product[] = [
  {
    id: "cinzeiro-squadafum-quadrado",
    slug: "cinzeiro-squadafum-quadrado",
    name: "Cinzeiro Quadrado Squadafum",
    brand: "Squadafum",
    category: "cinzeiros",
    image: "/products/cinzeiro-squadafum-quadrado-tie-dye.jpeg",
    images: ["/products/cinzeiro-squadafum-quadrado-tie-dye.jpeg"],
    price: 39.9,
    priceIsProvisional: true,
    shortDescription:
      "Cinzeiro quadrado de silicone, resistente a altas temperaturas.",
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
    slug: "kit-acessorios-case",
    name: "Kit de Acessórios com Case",
    category: "acessorios",
    image: "/products/kit-acessorios-case.jpeg",
    images: ["/products/kit-acessorios-case.jpeg"],
    price: 129.9,
    priceIsProvisional: true,
    shortDescription:
      "Kit com case, cuia, tesoura, seda RAW Classic e isqueiro.",
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
    slug: "firestar-mini-torch",
    name: "Isqueiro Maçarico Firestar",
    brand: "Firestar",
    category: "isqueiros",
    image: "/products/isqueiros-firestar-mini-torch.jpeg",
    images: ["/products/isqueiros-firestar-mini-torch.jpeg"],
    price: 59.9,
    priceIsProvisional: true,
    shortDescription: "Isqueiro maçarico compacto, em cores variadas.",
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
    slug: "sadhu-black-edition",
    name: "Dichavador Sadhu Black Edition",
    brand: "Sadhu",
    category: "dichavadores",
    image: "/products/dichavador-sadhu-black-edition.jpeg",
    images: ["/products/dichavador-sadhu-black-edition.jpeg"],
    price: 89.9,
    priceIsProvisional: true,
    shortDescription: "Dichavador metálico de 4 partes, Black Edition.",
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
    slug: "pipe-silicone-amarelo",
    name: "Pipe de Silicone Amarelo",
    category: "pipes",
    image: "/products/pipe-silicone-amarelo.jpeg",
    images: ["/products/pipe-silicone-amarelo.jpeg"],
    price: 44.9,
    priceIsProvisional: true,
    shortDescription: "Pipe de silicone amarelo com haste metálica.",
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
    slug: "cinzeiro-tonabe-hype",
    name: "Cinzeiro To NaBê Hype",
    brand: "To NaBê",
    category: "cinzeiros",
    image: "/products/cinzeiro-tonabe-hype.jpeg",
    images: ["/products/cinzeiro-tonabe-hype.jpeg"],
    price: 34.9,
    priceIsProvisional: true,
    shortDescription: "Cinzeiro de mesa com arte Hype.",
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
    slug: "bong-colter-laranja",
    name: "Bong de Vidro Colter — Laranja",
    brand: "Colter",
    category: "bongs",
    image: "/products/bong-vidro-colter-laranja.jpeg",
    images: ["/products/bong-vidro-colter-laranja.jpeg"],
    price: 249.9,
    priceIsProvisional: true,
    shortDescription: "Bong de vidro com detalhes gráficos em laranja.",
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
    slug: "firestar-planet-signos",
    name: "Isqueiro Maçarico Firestar Planet Signos",
    brand: "Firestar",
    category: "isqueiros",
    image: "/products/isqueiro-firestar-planet-signos.jpeg",
    images: ["/products/isqueiro-firestar-planet-signos.jpeg"],
    price: 64.9,
    priceIsProvisional: true,
    shortDescription: "Isqueiro maçarico recarregável com estampas de signos.",
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
    slug: "worldfire-emborrachado",
    name: "Maçarico Worldfire Emborrachado",
    brand: "Worldfire",
    category: "isqueiros",
    image: "/products/macarico-worldfire-emborrachado.jpeg",
    images: ["/products/macarico-worldfire-emborrachado.jpeg"],
    price: 54.9,
    priceIsProvisional: true,
    shortDescription: "Maçarico com acabamento emborrachado, em três cores.",
    description:
      "Maçarico emborrachado fotografado em três cores pela Krema.",
    specs: [
      "Acabamento emborrachado",
      "Cores azul, amarelo e roxo na fotografia",
    ],
    verified: false,
  },
];
