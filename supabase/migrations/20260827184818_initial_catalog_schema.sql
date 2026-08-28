-- Krema Tabacaria — schema inicial do catálogo e pedidos.
--
-- Cria: brands, categories, products, product_images, orders, order_items.
-- Habilita RLS em todas as tabelas.
--   - brands / categories / products / product_images: SELECT público
--     restrito aos registros de vitrine apropriados.
--   - orders / order_items: nenhuma policy pública. RLS habilitado sem
--     nenhuma policy nega acesso por padrão a "anon"/"authenticated";
--     leitura/escrita ficam reservadas ao service role (que ignora RLS),
--     usado a partir de um contexto de servidor em fase futura.
--
-- Não insere dados. Não cria seed.

create extension if not exists "pgcrypto";

-- =============================================================================
-- brands
-- =============================================================================
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  logo_width integer,
  logo_height integer,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- categories
-- =============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_order smallint,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- products
-- =============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand_id uuid references public.brands (id),
  category_id uuid not null references public.categories (id),
  short_description text not null,
  description text not null,
  specs text[] not null default '{}',
  price_cents integer not null,
  price_is_provisional boolean not null default true,
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx
  on public.products (category_id);

create index if not exists products_brand_id_idx
  on public.products (brand_id);

create index if not exists products_active_featured_idx
  on public.products (is_active, is_featured);

-- =============================================================================
-- product_images
-- =============================================================================
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  position smallint not null default 0,
  alt_text text,
  created_at timestamptz not null default now(),
  unique (product_id, position)
);

create index if not exists product_images_product_id_position_idx
  on public.product_images (product_id, position);

-- =============================================================================
-- orders
-- =============================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  customer_name text,
  customer_phone text,
  subtotal_cents integer not null,
  whatsapp_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx
  on public.orders (status);

create index if not exists orders_created_at_idx
  on public.orders (created_at);

-- =============================================================================
-- order_items
-- =============================================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  unit_price_cents_snapshot integer not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- brands / categories são taxonomia (sem flag de ativo/inativo no schema
-- atual), então "registro apropriado" é todo o registro.
create policy "brands_public_select"
  on public.brands
  for select
  to anon, authenticated
  using (true);

create policy "categories_public_select"
  on public.categories
  for select
  to anon, authenticated
  using (true);

-- products: só produtos ativos são "apropriados" para leitura pública.
create policy "products_public_select_active"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

-- product_images: só imagens de produtos ativos.
create policy "product_images_public_select_active_product"
  on public.product_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_images.product_id
        and p.is_active = true
    )
  );

-- orders / order_items: nenhuma policy criada de propósito. RLS habilitado
-- + zero policies = acesso negado por padrão para anon/authenticated em
-- todas as operações (SELECT/INSERT/UPDATE/DELETE). Apenas a service role
-- (que ignora RLS) poderá operar nessas tabelas.
