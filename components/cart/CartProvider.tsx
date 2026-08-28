"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Product, ProductVariant } from "@/types/product";

export type CartItem = {
  productId: string;
  /** Ausente = produto sem variante, comprado exatamente como antes de
   * variantes existirem. Presente = a variante específica escolhida
   * (cor/modelo) — obrigatória para produtos que têm variantes. */
  variantId?: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  /** true enquanto os dados dos produtos do carrinho estão sendo buscados. */
  isLoadingProducts: boolean;
  /** Dados atuais (nome, marca, imagem, preço, variantes) do produto,
   * vindos do Supabase via /api/products — undefined se ainda não
   * carregou ou se o id não existe mais no catálogo. */
  getProduct: (productId: string) => Product | undefined;
  /** A variante específica de um item do carrinho, resolvida a partir do
   * produto já buscado — undefined se o item não tem variantId, se o
   * produto ainda não carregou, ou se a variante não existe mais
   * (removida/desativada desde que foi adicionada ao carrinho). */
  getVariant: (
    productId: string,
    variantId: string | undefined,
  ) => ProductVariant | undefined;
  /** Preço efetivo de um item do carrinho (variant.price ?? product.price,
   * já resolvido pelo servidor em lib/products.ts) — undefined enquanto
   * não resolvido, mesmo critério de getProduct/getVariant. */
  getItemPrice: (item: CartItem) => number | undefined;
  addItem: (productId: string, variantId?: string, quantity?: number) => void;
  increment: (productId: string, variantId?: string) => void;
  decrement: (productId: string, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;
};

const CART_STORAGE_KEY = "krema:cart";

// Carrinho como "external store" (localStorage) lido via useSyncExternalStore.
// No servidor e na primeira renderização do cliente (hidratação) o snapshot é
// sempre o carrinho vazio — só depois disso o valor salvo é lido, sem gerar
// divergência entre servidor e navegador nem exigir setState dentro de efeito.
//
// O localStorage guarda SOMENTE {productId, variantId?, quantity}[] — nunca
// nome, preço, imagem, estoque ou qualquer outro dado do produto/variante.
// Esses dados vêm sempre do Supabase (via /api/products), nunca de cache do
// navegador. Carrinhos salvos antes de variantes existirem (sem a chave
// variantId) continuam funcionando normalmente — variantId ausente é lido
// como undefined, exatamente como um item sem variante hoje.
const emptyCart: CartItem[] = [];
let cartSnapshot: CartItem[] = emptyCart;
let hasReadStorage = false;
const listeners = new Set<() => void>();

function readFromStorage(): CartItem[] {
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CartItem[]) : emptyCart;
  } catch {
    // localStorage indisponível ou dado corrompido — carrinho começa vazio
    return emptyCart;
  }
}

function writeToStorage(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage indisponível — carrinho segue funcionando em memória
  }
}

function setCart(updater: (prev: CartItem[]) => CartItem[]) {
  cartSnapshot = updater(cartSnapshot);
  writeToStorage(cartSnapshot);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartItem[] {
  if (!hasReadStorage) {
    cartSnapshot = readFromStorage();
    hasReadStorage = true;
  }
  return cartSnapshot;
}

function getServerSnapshot(): CartItem[] {
  return emptyCart;
}

/** Mesma linha do carrinho = mesmo produto E mesma variante (ambas
 * undefined conta como "mesma", para produto sem variante). Duas
 * variantes diferentes do mesmo produto (ex.: Azul e Vermelho) NUNCA
 * são a mesma linha — cada uma soma quantidade só com ela mesma. */
function isSameLine(
  item: CartItem,
  productId: string,
  variantId: string | undefined,
): boolean {
  return item.productId === productId && item.variantId === variantId;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  // Dados dos produtos do carrinho, buscados em lote em /api/products (que
  // busca no Supabase — nunca acesso direto do client, nunca service role).
  // Já inclui as variantes de cada produto (embutidas no mesmo select em
  // lib/products.ts) — não existe endpoint separado pra variante.
  // Chave estável (ids distintos, ordenados) como dependência do efeito:
  // mudar só a quantidade/variante de um item já presente não deve refazer
  // a busca, só adicionar/remover um productId diferente deve.
  const [productsById, setProductsById] = useState<Record<string, Product>>(
    {},
  );
  // "Assentada" = o conjunto de ids para o qual a última busca (sucesso ou
  // erro) terminou. isLoadingProducts é derivado disso — nunca um setState
  // direto no corpo do efeito, só dentro dos callbacks da Promise (sucesso
  // ou erro), que é o padrão correto para sincronizar com sistema externo.
  const [settledProductIdsKey, setSettledProductIdsKey] = useState<
    string | null
  >(null);

  const productIdsKey = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.productId)))
        .sort()
        .join(","),
    [items],
  );

  const isLoadingProducts =
    productIdsKey !== "" && settledProductIdsKey !== productIdsKey;

  useEffect(() => {
    // Nada a buscar com o carrinho vazio. Não é preciso limpar
    // productsById aqui: com items vazio, getProduct()/subtotal nunca
    // consultam essas entradas, então deixá-las paradas é inofensivo.
    if (!productIdsKey) return;

    let cancelled = false;

    fetch(`/api/products?ids=${encodeURIComponent(productIdsKey)}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(
            body?.error ??
              `Falha ao carregar produtos do carrinho (${response.status})`,
          );
        }
        return response.json() as Promise<{ products: Product[] }>;
      })
      .then(({ products: fetchedProducts }) => {
        if (cancelled) return;

        const map: Record<string, Product> = {};
        for (const product of fetchedProducts) {
          map[product.id] = product;
        }
        setProductsById(map);
        setSettledProductIdsKey(productIdsKey);
      })
      .catch((error) => {
        // Não esconde o erro: fica no console para diagnóstico. A UI trata
        // "produto ainda não resolvido" da mesma forma que "id inexistente"
        // — não quebra, só omite aquele item até haver dado.
        console.error(
          "[CartProvider] Falha ao carregar produtos do carrinho:",
          error,
        );
        if (!cancelled) setSettledProductIdsKey(productIdsKey);
      });

    return () => {
      cancelled = true;
    };
  }, [productIdsKey]);

  const getProduct = useCallback(
    (productId: string) => productsById[productId],
    [productsById],
  );

  const getVariant = useCallback(
    (productId: string, variantId: string | undefined) => {
      if (!variantId) return undefined;
      return productsById[productId]?.variants?.find(
        (variant) => variant.id === variantId,
      );
    },
    [productsById],
  );

  const getItemPrice = useCallback(
    (item: CartItem): number | undefined => {
      const product = productsById[item.productId];
      if (!product) return undefined;

      if (!item.variantId) return product.price;

      const variant = product.variants?.find((v) => v.id === item.variantId);
      // Variante referenciada não existe mais (removida/desativada desde
      // que foi adicionada) — trata como item não resolvido, mesmo
      // comportamento que "produto removido do catálogo" já tinha.
      if (!variant) return undefined;

      return variant.price ?? product.price;
    },
    [productsById],
  );

  const addItem = useCallback(
    (productId: string, variantId?: string, quantity = 1) => {
      setCart((prev) => {
        const existing = prev.find((item) =>
          isSameLine(item, productId, variantId),
        );

        if (existing) {
          return prev.map((item) =>
            isSameLine(item, productId, variantId)
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }

        return [...prev, { productId, variantId, quantity }];
      });
    },
    [],
  );

  const increment = useCallback((productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.map((item) =>
        isSameLine(item, productId, variantId)
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }, []);

  const decrement = useCallback((productId: string, variantId?: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          isSameLine(item, productId, variantId)
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setCart((prev) =>
      prev.filter((item) => !isSameLine(item, productId, variantId)),
    );
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  // Preço sempre a partir do dado recém-buscado do Supabase — nunca de algo
  // persistido no navegador.
  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const price = getItemPrice(item);
        return price !== undefined ? total + price * item.quantity : total;
      }, 0),
    [items, getItemPrice],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      subtotal,
      isOpen,
      isLoadingProducts,
      getProduct,
      getVariant,
      getItemPrice,
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
      isLoadingProducts,
      getProduct,
      getVariant,
      getItemPrice,
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
