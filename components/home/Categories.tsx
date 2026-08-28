"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

// Combina next/image (otimização) com o hover animado do Motion na própria imagem.
const MotionImage = motion.create(Image);

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
      className="bg-[#080808] px-5 py-14 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mb-8 max-w-2xl md:mb-16"
        >
          <h2 className="text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
            Encontre o que combina com você.
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2">
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
                className="group relative block h-full min-h-[230px] overflow-hidden rounded-[2rem] bg-[#111] md:min-h-0"
              >
                <MotionImage
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 50vw"
                  className="object-cover"
                  whileHover={{
                    scale: 1.06,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
                  <div className="flex items-end justify-between gap-3">
                    <h3 className="text-xl font-semibold tracking-tight md:text-4xl">
                      {category.title}
                    </h3>

                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition duration-300 group-hover:-translate-y-1 group-hover:bg-white group-hover:text-black md:size-11">
                      <ArrowUpRight className="size-4 md:size-5" />
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