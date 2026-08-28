-- Krema Tabacaria — função RPC para criar pedido (orders + order_items) de
-- forma atômica.
--
-- orders/order_items não têm policy pública de INSERT (ver migration de
-- schema inicial) — esta função é a ÚNICA porta de escrita para pedidos, e
-- só pode ser executada pela service role (grants abaixo revogam de
-- anon/authenticated). Chamada exclusivamente a partir de lib/orders.ts,
-- via app/api/orders/route.ts.
--
-- Preço e subtotal chegam como parâmetros já resolvidos no servidor (nunca
-- confiar em valor vindo do cliente) — a função em si não recalcula preço,
-- só grava o que a Route Handler já validou contra o catálogo atual.

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_subtotal_cents integer,
  p_whatsapp_message text,
  p_items jsonb
)
returns table (order_id uuid)
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'create_order: p_items não pode ser vazio';
  end if;

  if p_subtotal_cents is null or p_subtotal_cents < 0 then
    raise exception 'create_order: p_subtotal_cents inválido';
  end if;

  -- Defesa em profundidade: quantity > 0 em todos os itens, mesmo que a
  -- Route Handler já valide isso antes de chamar a função.
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item
    where coalesce((item ->> 'quantity')::integer, 0) <= 0
  ) then
    raise exception 'create_order: quantity deve ser maior que zero em todos os itens';
  end if;

  insert into public.orders (
    status, customer_name, customer_phone, subtotal_cents, whatsapp_message
  )
  values (
    'pending', p_customer_name, p_customer_phone, p_subtotal_cents, p_whatsapp_message
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, product_name_snapshot, unit_price_cents_snapshot, quantity
  )
  select
    v_order_id,
    (item ->> 'product_id')::uuid,
    item ->> 'product_name_snapshot',
    (item ->> 'unit_price_cents_snapshot')::integer,
    (item ->> 'quantity')::integer
  from jsonb_array_elements(p_items) as item;

  return query select v_order_id;
end;
$$;

-- Só a service role pode executar. Se qualquer papel público pudesse chamar
-- isso diretamente via REST/RPC, poderia forjar pedidos com preço/subtotal
-- arbitrários — a função confia cegamente nos parâmetros recebidos, por
-- isso quem chama precisa já ser um contexto de confiança (servidor).
revoke all on function public.create_order(text, text, integer, text, jsonb) from public;
revoke all on function public.create_order(text, text, integer, text, jsonb) from anon, authenticated;
grant execute on function public.create_order(text, text, integer, text, jsonb) to service_role;
