-- Krema Tabacaria — seed inicial do catálogo (categorias, marcas, produtos,
-- imagens).
--
-- Fonte de verdade: data/products.ts e data/categories.ts (estado do
-- repositório em 2026-08-27). Marcas: união entre o campo `brand` de
-- data/products.ts e a lista de logos em components/home/Brands.tsx — RAW
-- não é `brand` de nenhum produto hoje, mas é citada nas specs/descrição do
-- "Kit de Acessórios com Case" ("Seda RAW Classic") e tem logo em Brands.tsx,
-- por isso entra; nenhuma marca foi inventada.
--
-- URLs de imagem continuam apontando para /products/... (public/), conforme
-- a arquitetura aprovada — Supabase Storage é fase futura.
--
-- Idempotente: cada INSERT usa ON CONFLICT ... DO NOTHING na chave natural
-- (slug para categories/brands/products; (product_id, position) para
-- product_images) — executar mais de uma vez não duplica registros.
--
-- Não insere orders/order_items.

-- =============================================================================
-- categories (6 — mesma ordem/rótulo de data/categories.ts)
-- =============================================================================
insert into public.categories (slug, name, display_order)
values
  ('cinzeiros', 'Cinzeiros', 1),
  ('dichavadores', 'Dichavadores', 2),
  ('isqueiros', 'Isqueiros', 3),
  ('pipes', 'Pipes', 4),
  ('bongs', 'Bongs', 5),
  ('acessorios', 'Acessórios', 6)
on conflict (slug) do nothing;

-- =============================================================================
-- brands (7 — as 6 usadas como `brand` em data/products.ts + RAW)
--
-- slugs gerados mecanicamente a partir do nome (não existe `brand.slug` na
-- fonte atual). "Firestar" usa a grafia de data/products.ts (fonte de
-- verdade); o arquivo de logo mantém o nome real em disco, "FireStar.png".
-- =============================================================================
insert into public.brands (slug, name, logo_url, logo_width, logo_height)
values
  ('squadafum', 'Squadafum', '/brands/squadafum.png', 345, 307),
  ('raw', 'RAW', '/brands/raw.png', 697, 286),
  ('firestar', 'Firestar', '/brands/FireStar.png', 193, 144),
  ('sadhu', 'Sadhu', '/brands/sadhu.png', 1165, 340),
  ('to-nabe', 'To NaBê', null, null, null),
  ('colter', 'Colter', null, null, null),
  ('worldfire', 'Worldfire', null, null, null)
on conflict (slug) do nothing;

-- =============================================================================
-- products (9 — todos os produtos de data/products.ts)
--
-- brand_id/category_id resolvidos por slug via subquery, não por id
-- literal, para o seed continuar correto independente da ordem/re-execução.
-- stock_quantity e is_active ficam no default da tabela (0 e true): não há
-- campo de estoque na fonte atual, então não é inventado aqui; is_active =
-- true (default) é coerente por serem os produtos hoje exibidos no site.
-- =============================================================================
insert into public.products (
  slug, name, brand_id, category_id, short_description, description, specs,
  price_cents, price_is_provisional, is_featured, verified
)
values
  (
    'cinzeiro-squadafum-quadrado',
    'Cinzeiro Quadrado Squadafum',
    (select id from public.brands where slug = 'squadafum'),
    (select id from public.categories where slug = 'cinzeiros'),
    'Cinzeiro quadrado de silicone, resistente a altas temperaturas.',
    'Cinzeiro quadrado de silicone em visual colorido. A foto enviada mostra uma versão tie-dye e uma versão turquesa.',
    ARRAY['Silicone', 'Modelo quadrado', 'Aproximadamente 10 cm de diâmetro', 'Aproximadamente 3 cm de altura', 'Resistente a altas temperaturas']::text[],
    3990, true, true, true
  ),
  (
    'kit-acessorios-case',
    'Kit de Acessórios com Case',
    null,
    (select id from public.categories where slug = 'acessorios'),
    'Kit com case, cuia, tesoura, seda RAW Classic e isqueiro.',
    'Kit fotografado pela Krema com case, cuia, tesoura, seda RAW Classic e isqueiro.',
    ARRAY['Case com zíper', 'Cuia de silicone', 'Tesoura dobrável', 'Seda RAW Classic', 'Isqueiro']::text[],
    12990, true, true, false
  ),
  (
    'firestar-mini-torch',
    'Isqueiro Maçarico Firestar',
    (select id from public.brands where slug = 'firestar'),
    (select id from public.categories where slug = 'isqueiros'),
    'Isqueiro maçarico compacto, em cores variadas.',
    'Isqueiro maçarico Firestar compacto, fotografado em diferentes cores.',
    ARRAY['Marca Firestar', 'Acendimento tipo maçarico', 'Formato compacto', 'Cores variadas']::text[],
    5990, true, true, true
  ),
  (
    'sadhu-black-edition',
    'Dichavador Sadhu Black Edition',
    (select id from public.brands where slug = 'sadhu'),
    (select id from public.categories where slug = 'dichavadores'),
    'Dichavador metálico de 4 partes, Black Edition.',
    'Dichavador metálico Sadhu Black Edition de quatro partes.',
    ARRAY['Metal', '4 partes', 'Modelo Black Edition', 'Diâmetro aproximado de 6,3 cm', 'Altura aproximada de 4,4 cm']::text[],
    8990, true, true, true
  ),
  (
    'pipe-silicone-amarelo',
    'Pipe de Silicone Amarelo',
    null,
    (select id from public.categories where slug = 'pipes'),
    'Pipe de silicone amarelo com haste metálica.',
    'Pipe de silicone amarelo com haste metálica, conforme fotografia enviada pela Krema.',
    ARRAY['Silicone', 'Haste metálica', 'Cor amarela']::text[],
    4490, true, false, false
  ),
  (
    'cinzeiro-tonabe-hype',
    'Cinzeiro To NaBê Hype',
    (select id from public.brands where slug = 'to-nabe'),
    (select id from public.categories where slug = 'cinzeiros'),
    'Cinzeiro de mesa com arte Hype.',
    'Cinzeiro de mesa com arte Hype, identificado visualmente como To NaBê.',
    ARRAY['Cinzeiro de mesa', 'Arte Hype', 'Acabamento colorido']::text[],
    3490, true, true, false
  ),
  (
    'bong-colter-laranja',
    'Bong de Vidro Colter — Laranja',
    (select id from public.brands where slug = 'colter'),
    (select id from public.categories where slug = 'bongs'),
    'Bong de vidro com detalhes gráficos em laranja.',
    'Bong de vidro com detalhes gráficos em laranja, identificado pela marca visível na peça.',
    ARRAY['Vidro', 'Detalhes gráficos em laranja', 'Peça fotografada individualmente']::text[],
    24990, true, true, false
  ),
  (
    'firestar-planet-signos',
    'Isqueiro Maçarico Firestar Planet Signos',
    (select id from public.brands where slug = 'firestar'),
    (select id from public.categories where slug = 'isqueiros'),
    'Isqueiro maçarico recarregável com estampas de signos.',
    'Isqueiro maçarico Firestar Planet com estampas inspiradas nos signos do zodíaco.',
    ARRAY['Marca Firestar', 'Modelo Planet Signos', 'Recarregável', 'Chama tipo maçarico', 'Estampas de signos']::text[],
    6490, true, true, true
  ),
  (
    'worldfire-emborrachado',
    'Maçarico Worldfire Emborrachado',
    (select id from public.brands where slug = 'worldfire'),
    (select id from public.categories where slug = 'isqueiros'),
    'Maçarico com acabamento emborrachado, em três cores.',
    'Maçarico emborrachado fotografado em três cores pela Krema.',
    ARRAY['Acabamento emborrachado', 'Cores azul, amarelo e roxo na fotografia']::text[],
    5490, true, true, false
  )
on conflict (slug) do nothing;

-- =============================================================================
-- product_images (9 — uma capa por produto, position 0)
--
-- Hoje `image` e `images[0]` são idênticos e cada produto tem só uma
-- imagem em data/products.ts — por isso 1 linha por produto, não mais.
-- =============================================================================
insert into public.product_images (product_id, url, position)
values
  ((select id from public.products where slug = 'cinzeiro-squadafum-quadrado'), '/products/cinzeiro-squadafum-quadrado-tie-dye.jpeg', 0),
  ((select id from public.products where slug = 'kit-acessorios-case'), '/products/kit-acessorios-case.jpeg', 0),
  ((select id from public.products where slug = 'firestar-mini-torch'), '/products/isqueiros-firestar-mini-torch.jpeg', 0),
  ((select id from public.products where slug = 'sadhu-black-edition'), '/products/dichavador-sadhu-black-edition.jpeg', 0),
  ((select id from public.products where slug = 'pipe-silicone-amarelo'), '/products/pipe-silicone-amarelo.jpeg', 0),
  ((select id from public.products where slug = 'cinzeiro-tonabe-hype'), '/products/cinzeiro-tonabe-hype.jpeg', 0),
  ((select id from public.products where slug = 'bong-colter-laranja'), '/products/bong-vidro-colter-laranja.jpeg', 0),
  ((select id from public.products where slug = 'firestar-planet-signos'), '/products/isqueiro-firestar-planet-signos.jpeg', 0),
  ((select id from public.products where slug = 'worldfire-emborrachado'), '/products/macarico-worldfire-emborrachado.jpeg', 0)
on conflict (product_id, position) do nothing;
