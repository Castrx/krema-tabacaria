-- Krema Tabacaria — bucket de Supabase Storage para imagens de produto.
--
-- Bucket público SÓ para leitura: `public = true` habilita o endpoint
-- .../storage/v1/object/public/product-images/... sem autenticação
-- (usado pelo catálogo público via product_images.url), e a policy de
-- SELECT abaixo cobre o mesmo acesso pelo caminho autenticado da API de
-- Storage — defesa em profundidade, mesmo critério já usado nas tabelas
-- deste projeto.
--
-- Upload/update/delete: nenhuma policy pública criada de propósito.
-- storage.objects já vem com RLS habilitada por padrão no Supabase; zero
-- policies de escrita para anon/authenticated = negado por padrão. Só o
-- service role escreve (lib/admin/products.ts, sempre atrás de
-- requireAdmin() nas Server Actions) — mesmo modelo de
-- orders/order_items/product_variants.
--
-- file_size_limit e allowed_mime_types replicam, no próprio bucket, os
-- mesmos limites já validados em código (lib/admin/products.ts) — defesa
-- em profundidade: mesmo que a validação da aplicação tenha um bug, o
-- Storage em si rejeita arquivo fora do tipo/tamanho permitido.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "product_images_storage_public_select"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');
