"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Liga o Motion ao prefers-reduced-motion do SO/navegador para toda a
 * árvore do app (usado uma única vez, em app/layout.tsx) — em vez de
 * cada componente que usa motion.* (Header, Categories, Brands,
 * FeaturedProducts, ProductGrid, ProductCard, Location, InstagramPreview)
 * reimplementar essa checagem por conta própria.
 *
 * reducedMotion="user": a própria Motion passa a tratar toda animação de
 * valor "posicional" (x, y, scale, rotate, width, height — ver
 * positionalKeys em motion-dom) como instantânea para quem tem "Reduzir
 * movimento" ativado, sem precisar tocar em nenhum initial/animate/
 * whileHover/whileInView já escrito. Opacidade não é posicional, então
 * fades continuam suaves — o conteúdo nunca some, só perde o
 * deslocamento/zoom/parallax.
 *
 * Isto NÃO cobre valores de scroll ligados direto a `style` via
 * useScroll()/useTransform() (Hero.tsx, AboutKrema.tsx) — esses dois são
 * ajustados manualmente, com useReducedMotion(), nos próprios arquivos.
 *
 * Precisa ser um Client Component isolado: motion/react não roda em
 * Server Component, e app/layout.tsx precisa continuar Server Component
 * para poder exportar `metadata`.
 */
export function MotionConfigProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
