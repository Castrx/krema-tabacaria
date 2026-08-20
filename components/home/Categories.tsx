"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

const categories = [
  {
    title: "Dichavadores",
    subtitle: "Precisão em cada detalhe",
    image: "/products/dichavador-sadhu-black-edition.jpeg",
    href: "#produtos",
    size: "large",
  },
  {
    title: "Isqueiros",
    subtitle: "Chama no seu estilo",
    image: "/products/isqueiros-firestar-mini-torch.jpeg",
    href: "#produtos",
    size: "small",
  },
  {
    title: "Cinzeiros",
    subtitle: "Design para a sua rotina",
    image: "/products/cinzeiro-squadafum-quadrado-tie-dye.jpeg",
    href: "#produtos",
    size: "small",
  },
  {
    title: "Acessórios",
    subtitle: "Tudo em um só lugar",
    image: "/products/kit-acessorios-case.jpeg",
    href: "#produtos",
    size: "large",
  },
];

export function Categories() {
  return (
    <section
      id="categorias"
      className="bg-[#080808] px-5 py-24 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-2xl md:mb-16"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">
            Explore a Krema
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
            Encontre o que combina com você.
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 md:text-base">
            Uma seleção de produtos e acessórios escolhidos para fazer parte
            da experiência Krema.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{
                opacity: 0,
                y: 35,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.65,
                delay: index * 0.08,
                ease: "easeOut",
              }}
              className={
                category.size === "large"
                  ? "md:min-h-[540px]"
                  : "md:min-h-[420px]"
              }
            >
              <Link
                href={category.href}
                className="group relative block h-full min-h-[390px] overflow-hidden rounded-[2rem] bg-[#111] md:min-h-0"
              >
                <motion.img
                  src={category.image}
                  alt={category.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  whileHover={{
                    scale: 1.06,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/50">
                        {category.subtitle}
                      </p>

                      <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
                        {category.title}
                      </h3>
                    </div>

                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition duration-300 group-hover:-translate-y-1 group-hover:bg-white group-hover:text-black">
                      <ArrowUpRight className="size-5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}