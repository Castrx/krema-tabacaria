"use client";

import { ArrowUpRight, MapPin, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { WHATSAPP_NUMBER } from "@/lib/constants";

const MAPS_EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
// Sem o nome do negócio de propósito: o Google Maps já tem um cadastro de
// Google Business Profile para "Krema Tabacaria e Head Shop" num endereço
// DIFERENTE (R. Castro Alves, 47) — incluir o nome na busca faz o Google
// sempre corresponder a esse cadastro desatualizado, em vez do endereço
// abaixo, independente do modo da API (testado em "place" e "search").
// Só o endereço, sem o nome, geocodifica corretamente para o endereço
// oficial confirmado pelo proprietário. Atualizar o Google Business Profile
// da Krema é uma ação separada, fora deste código.
const MAPS_QUERY = "Rua Paulista, 37, Centro, Arroio do Sal, RS, 95585-000";
const MAPS_DIRECTIONS_URL =
  "https://www.google.com/maps/search/?api=1&query=Rua+Paulista+37+Centro+Arroio+do+Sal+RS+95585-000";

export function Location() {
  return (
    <section
      id="localizacao"
      className="bg-[#080808] px-5 py-14 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid overflow-hidden rounded-[2rem] border border-white/[0.07] bg-[#101010] lg:grid-cols-[0.7fr_1fr]">
          {/* Informações */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col justify-center gap-7 p-7 md:p-10 lg:p-12"
          >
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
              A experiência começa aqui.
            </h2>

            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <MapPin className="size-5 text-white/70" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Arroio do Sal - RS
                </p>

                <p className="mt-1 text-sm text-white/45">
                  Rua Paulista, 37 · Centro
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition duration-300 hover:scale-[1.02]"
              >
                Como chegar
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Olá%20Krema!%20Vi%20o%20site%20e%20quero%20saber%20mais.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white transition duration-300 hover:bg-white/[0.08]"
              >
                <MessageCircle className="size-4" />
                Falar no WhatsApp
              </a>
            </div>
          </motion.div>

          {/* Mapa */}
          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="relative h-[280px] w-full overflow-hidden bg-[#171717] sm:h-[320px] lg:h-auto lg:min-h-[420px] lg:max-h-[500px]"
          >
            {MAPS_EMBED_KEY ? (
              <iframe
                title="Localização da Krema Tabacaria no Google Maps"
                src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_EMBED_KEY}&q=${encodeURIComponent(
                  MAPS_QUERY,
                )}`}
                className="absolute inset-0 h-full w-full border-0 grayscale-[15%]"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-white/40">
                Mapa indisponível. Configure NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY.
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
