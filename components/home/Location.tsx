"use client";

import { ArrowUpRight, MapPin, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

export function Location() {
  return (
    <section
      id="localizacao"
      className="bg-[#080808] px-5 py-14 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid overflow-hidden rounded-[2rem] border border-white/[0.07] bg-[#101010] lg:grid-cols-[1fr_0.85fr]">
          {/* Informações */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col justify-between p-7 md:p-10 lg:p-14"
          >
            <div>
              <h2 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
                A experiência começa aqui.
              </h2>
            </div>

            <div className="mt-8">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <MapPin className="size-5 text-white/70" />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Arroio do Sal — RS
                  </p>

                  <p className="mt-1 text-sm text-white/45">
                    Rua Paulista, nº 37
                    <br />
                    Centro
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Rua+Paulista+37+Centro+Arroio+do+Sal+RS"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition duration-300 hover:scale-[1.02]"
                >
                  Como chegar
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>

                <a
                  href="https://wa.me/5551992729284?text=Olá%20Krema!%20Vi%20o%20site%20e%20quero%20saber%20mais."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white transition duration-300 hover:bg-white/[0.08]"
                >
                  <MessageCircle className="size-4" />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </motion.div>

          {/* Área visual / mapa */}
          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative min-h-[240px] overflow-hidden bg-[#171717] lg:min-h-full"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,138,50,0.15),transparent_42%)]" />

            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />

            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
              }}
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            >
              <div className="flex size-16 items-center justify-center rounded-full border border-[#d48a32]/40 bg-[#d48a32]/10 backdrop-blur-md">
                <MapPin className="size-7 text-[#e5a24d]" />
              </div>

              <div className="mt-4 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/65 backdrop-blur-md">
                Krema
              </div>
            </motion.div>

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <p className="text-sm text-white/65">
                  Centro · Arroio do Sal
                </p>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Rua+Paulista+37+Centro+Arroio+do+Sal+RS"
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir localização no Google Maps"
                className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/70 backdrop-blur-md transition hover:bg-white hover:text-black"
              >
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}