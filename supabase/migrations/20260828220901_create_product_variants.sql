-- Krema Tabacaria — estrutura de variantes de produto (cor/modelo).
--
-- Cria product_variants (arquitetura já aprovada, ver comentários em
-- lib/products.ts / types/product.ts sobre o suporte antecipado a
-- variantes) e adiciona a referência opcional de variante em
-- order_items. Somente estrutura — nenhuma variante é cadastrada aqui,
-- nenhuma UI (site público ou admin) usa esta tabela ainda.
--
-- product_variants: SELECT público restrito a variantes ativas de
-- produtos ativos, mesmo critério já usado em product_images. Nenhuma
-- policy de INSERT/UPDATE/DELETE — igual orders/order_items, escrita
-- fica reservada ao service role, chamada só a partir de código
-- server-side protegido por requireAdmin() (CRUD de variantes é fase
-- futura, ainda não implementada).

-- =============================================================================
-- product_variants
-- =============================================================================
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  color text,
  model text,
  price_cents integer,
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  position smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, color, model)
);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

create index if not exists product_variants_product_id_active_idx
  on public.product_variants (product_id, is_active);

alter table public.product_variants enable row level security;

-- Mesmo critério de product_images_public_select_active_product: só
-- variantes ativas de produtos ativos são "apropriadas" para leitura
-- pública.
create policy "product_variants_public_select_active"
  on public.product_variants
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.products p
      where p.id = product_variants.product_id
        and p.is_active = true
    )
  );

-- Nenhuma policy de INSERT/UPDATE/DELETE de propósito — RLS habilitado +
-- zero policies de escrita = acesso negado por padrão para
-- anon/authenticated em todas as operações de escrita.

-- =============================================================================
-- order_items — referência opcional à variante comprada
-- =============================================================================
-- variant_id nullable: pedidos de produtos sem variante continuam
-- funcionando exatamente como hoje (variant_id null). ON DELETE SET
-- NULL (não CASCADE): apagar uma variante não pode apagar o histórico
-- do pedido — só perde a referência; variant_label_snapshot preserva
-- o que foi de fato comprado, no mesmo espírito de
-- product_name_snapshot/unit_price_cents_snapshot já existentes.
alter table public.order_items
  add column if not exists variant_id uuid
    references public.product_variants (id) on delete set null;

alter table public.order_items
  add column if not exists variant_label_snapshot text;
