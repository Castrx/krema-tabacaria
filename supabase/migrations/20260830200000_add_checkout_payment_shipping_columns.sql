-- Krema Tabacaria — etapa 1 do checkout real (Mercado Pago + Melhor Envio):
-- só as colunas necessárias em orders/products. Nenhuma tabela nova,
-- nenhuma mudança em order_items/product_variants, nenhuma integração de
-- gateway ou frete ainda, nenhuma baixa de estoque ainda — só schema.
--
-- Tudo aditivo e nullable, sem nenhum DEFAULT: o fluxo de WhatsApp
-- (lib/orders.ts → RPC create_order) continua funcionando exatamente como
-- hoje, sem tocar em nenhuma coluna nova — esta migration não altera
-- create_order nem nenhum código.
--
-- Idempotente: todas as colunas usam "add column if not exists", com
-- DEFAULT/CHECK inline na mesma cláusula — Postgres trata IF NOT EXISTS
-- como pulando a cláusula inteira (tipo, default e check) quando a coluna
-- já existe, então rodar esta migration duas vezes não falha e não tenta
-- recriar nenhuma constraint.

-- =============================================================================
-- orders — pagamento e entrega
-- =============================================================================
-- payment_id: id do pagamento no gateway (ex.: payment.id do Mercado
--   Pago). unique, mas nullable — Postgres permite múltiplas linhas com
--   NULL numa coluna unique (nunca são consideradas iguais entre si), o
--   que é exatamente o caso de todo pedido hoje (fluxo WhatsApp) e de
--   todo pedido novo até o pagamento ser de fato criado no gateway.
--   Preenchido futuramente só pelo webhook, nunca na criação do pedido.
--
-- payment_status: conceito DELIBERADAMENTE separado de orders.status.
--   orders.status (não alterado nesta migration) é o status operacional
--   do pedido, controlado hoje manualmente pelo admin
--   (pending/confirmed/cancelled — ver lib/admin/orders.ts). payment_status
--   é o status do PAGAMENTO em si, que só uma etapa futura (webhook do
--   gateway) vai atualizar de verdade.
--
--   NULLABLE, sem DEFAULT — de propósito, depois de revisar a primeira
--   versão desta migration. NULL aqui significa "este pedido não tem
--   pagamento online" (é exatamente o caso de todo pedido do fluxo
--   WhatsApp, hoje e enquanto lib/orders.ts não for alterado — fora do
--   escopo desta etapa). Um DEFAULT 'pending' faria TODO pedido do
--   WhatsApp nascer marcado como "pagamento pendente", o que é falso —
--   esses pedidos nunca passam por nenhum gateway, então não existe
--   pagamento nenhum, pendente ou não. NULL evita essa confusão sem
--   precisar de nenhuma lógica extra pra distinguir os dois casos.
--
--   'pending' só passa a existir de verdade quando o futuro checkout do
--   Mercado Pago criar o pedido (ainda não implementado): o pedido nasce
--   com payment_status = 'pending' e payment_id ainda NULL (o pagamento
--   em si só é criado/confirmado depois, no Mercado Pago); o webhook,
--   validado, é quem atualiza payment_status (e preenche payment_id) pra
--   'approved'/'rejected'/'cancelled'/'refunded' conforme o resultado real.
--
--   CHECK permite NULL explicitamente junto com o conjunto de valores —
--   seguro de adicionar agora (coluna nova, ainda não existe nenhum dado
--   que possa violá-lo; sem DEFAULT, todo pedido existente e todo pedido
--   novo do WhatsApp fica NULL, que já está coberto pelo CHECK). Valores
--   não-nulos cobrem o ciclo de vida genérico de um pagamento; o
--   vocabulário específico do Mercado Pago (in_process, in_mediation,
--   authorized, charged_back etc.) fica pra quando a integração de
--   verdade for implementada — mapear pra este conjunto menor, ou
--   estender o CHECK, é decisão dessa etapa futura.
--
-- shipping_address: snapshot do endereço de entrega no momento da compra
--   — mesmo formato de DeliveryDetails (lib/checkout.ts, etapa 1 do
--   checkout com entrega já implementada). jsonb em vez de colunas
--   separadas (rua, número, bairro...) porque esse bloco só é lido/exibido
--   inteiro, nunca consultado por campo individual — não há hoje nenhum
--   requisito de buscar pedidos por cidade/UF que justificasse colunas
--   próprias. Sem CHECK de formato: validação de shape é responsabilidade
--   do código (mesmo critério já usado em whatsapp_message, que também
--   não tem CHECK).
--
-- shipping_cost_cents / total_cents: mesma unidade (centavos) e mesmo
--   critério de nullability que subtotal_cents já usa hoje — mas aqui
--   nullable, porque só passam a existir quando o pedido de fato tem
--   frete/pagamento calculado (todo pedido WhatsApp fica com os dois
--   NULL). CHECK >= 0 quando presentes: dado obviamente inválido (frete
--   ou total negativo) não deveria nem entrar no banco — zero risco pra
--   dado existente, já que a coluna é nova e começa vazia.
--
-- shipping_service: nome do serviço de frete escolhido (ex.: "Correios
--   PAC", "Jadlog .Package") — texto livre, mesmo critério de
--   customer_name/customer_phone (sem CHECK de formato).
--
-- tracking_code: código de rastreio, preenchido bem depois do pagamento
--   (só quando a etiqueta for gerada) — não bloqueia nada do fluxo de
--   pagamento em si.
alter table public.orders
  add column if not exists payment_id text unique,
  add column if not exists payment_status text
    check (
      payment_status is null
      or payment_status in ('pending', 'approved', 'rejected', 'cancelled', 'refunded')
    ),
  add column if not exists shipping_address jsonb,
  add column if not exists shipping_cost_cents integer
    check (shipping_cost_cents is null or shipping_cost_cents >= 0),
  add column if not exists shipping_service text,
  add column if not exists total_cents integer
    check (total_cents is null or total_cents >= 0),
  add column if not exists tracking_code text;

-- =============================================================================
-- products — peso e dimensões (necessários pra cotação de frete)
-- =============================================================================
-- Todos nullable de propósito: nenhum produto cadastrado hoje tem esse
-- dado, e cadastrar peso/dimensões reais é trabalho manual futuro (fora
-- do escopo desta migration) — tornar obrigatório agora quebraria a
-- listagem/edição de todo o catálogo existente. numeric (não integer)
-- em length/width/height porque dimensão em cm frequentemente tem casa
-- decimal (ex.: 12.5cm); weight_grams fica integer porque grama já é a
-- menor unidade prática de peso pra envio.
--
-- CHECK > 0 quando presentes: mesmo raciocínio de shipping_cost_cents —
-- peso/dimensão zero ou negativo é sempre dado inválido, e a coluna
-- começa vazia em todo produto existente, então não há risco de violar
-- dado atual.
alter table public.products
  add column if not exists weight_grams integer
    check (weight_grams is null or weight_grams > 0),
  add column if not exists length_cm numeric
    check (length_cm is null or length_cm > 0),
  add column if not exists width_cm numeric
    check (width_cm is null or width_cm > 0),
  add column if not exists height_cm numeric
    check (height_cm is null or height_cm > 0);

-- =============================================================================
-- RLS
-- =============================================================================
-- Nenhuma policy nova necessária. RLS é por linha, não por coluna: as
-- policies existentes (orders sem SELECT público; products com SELECT
-- público restrito a is_active = true) já cobrem as colunas novas
-- automaticamente, sem precisar de nenhum ajuste.
