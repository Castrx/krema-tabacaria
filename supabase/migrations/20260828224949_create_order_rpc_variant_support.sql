-- Krema Tabacaria — create_order() passa a gravar variant_id e
-- variant_label_snapshot em order_items.
--
-- As duas colunas já existem (ver
-- supabase/migrations/*_create_product_variants.sql), mas a função RPC
-- ainda não as inseria — lib/orders.ts agora resolve e valida a
-- variante no servidor e passa variant_id/variant_label_snapshot dentro
-- de cada item de p_items; sem este ajuste na função, esses dois campos
-- seriam silenciosamente descartados no insert.
--
-- Mesma assinatura da função (create or replace preserva os grants
-- existentes) — só o corpo muda. Re-declarados os grants mesmo assim,
-- pelo mesmo motivo de sempre: nunca depender de estado implícito.

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
    order_id, product_id, product_name_snapshot, unit_price_cents_snapshot,
    quantity, variant_id, variant_label_snapshot
  )
  select
    v_order_id,
    (item ->> 'product_id')::uuid,
    item ->> 'product_name_snapshot',
    (item ->> 'unit_price_cents_snapshot')::integer,
    (item ->> 'quantity')::integer,
    -- ambos nullable: pedido de produto sem variante manda variant_id
    -- ausente/null no JSON, ->> devolve SQL NULL nesse caso, sem erro.
    nullif(item ->> 'variant_id', '')::uuid,
    item ->> 'variant_label_snapshot'
  from jsonb_array_elements(p_items) as item;

  return query select v_order_id;
end;
$$;

revoke all on function public.create_order(text, text, integer, text, jsonb) from public;
revoke all on function public.create_order(text, text, integer, text, jsonb) from anon, authenticated;
grant execute on function public.create_order(text, text, integer, text, jsonb) to service_role;
