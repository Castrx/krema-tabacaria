"use client";

import { motion } from "motion/react";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-white/45">
        Nenhum produto encontrado.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.5,
            delay: index * 0.04,
            ease: "easeOut",
          }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}
