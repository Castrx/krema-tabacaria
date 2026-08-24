"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products } from "@/data/products";

export type CartItem = {
  productId: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (productId: string, quantity?: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  removeItem: (productId: string) => void;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;
};

const CART_STORAGE_KEY = "krema:cart";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Carrega o carrinho salvo apenas no cliente, para não gerar
  // divergência entre a renderização do servidor e a do navegador.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored) as CartItem[]);
      }
    } catch {
      // localStorage indisponível ou dado corrompido — carrinho começa vazio
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);

      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...prev, { productId, quantity }];
    });
  }, []);

  const increment = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }, []);

  const decrement = useCallback((productId: string) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const product = products.find((p) => p.id === item.productId);
        return product ? total + product.price * item.quantity : total;
      }, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      subtotal,
      isOpen,
      addItem,
      increment,
      decrement,
      removeItem,
      openCart,
      closeCart,
      setOpen: setIsOpen,
    }),
    [
      items,
      count,
      subtotal,
      isOpen,
      addItem,
      increment,
      decrement,
      removeItem,
      openCart,
      closeCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart precisa ser usado dentro de um CartProvider");
  }

  return context;
}
