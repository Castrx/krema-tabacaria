"use client";

import Image from "next/image";
import { ArrowUpRight, Camera } from "lucide-react";
import { motion } from "motion/react";

const posts = [
  {
    image: "/products/isqueiros-firestar-mini-torch.jpeg",
    alt: "Isqueiros Firestar",
  },
  {
    image: "/products/dichavador-sadhu-black-edition.jpeg",
    alt: "Dichavador Sadhu",
  },
  {
    image: "/products/cinzeiro-squadafum-quadrado-tie-dye.jpeg",
    alt: "Cinzeiro Squadafum",
  },
  {
    image: "/products/bong-vidro-colter-laranja.jpeg",
    alt: "Bong de vidro",
  },
];

export function InstagramPreview() {
  return (
    <section
      id="instagram"
      className="overflow-hidden bg-[#080808] px-5 py-14 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
              Acompanhe a Krema.
            </h2>
          </motion.div>

          <a
            href="https://instagram.com/krematabacaria"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Camera className="size-4" />
            @krematabacaria
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {posts.map((post, index) => (
            <motion.a
              key={post.image}
              href="https://instagram.com/krematabacaria"
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.6,
                delay: index * 0.07,
              }}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-[#111]"
            >
              <Image
                src={post.image}
                alt={post.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/20" />

              <div className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white opacity-0 backdrop-blur-md transition duration-300 group-hover:opacity-100">
                <Camera className="size-4" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}