-- Krema Tabacaria — confirm_order_payment(): confirmação de pagamento +
-- baixa atômica de estoque.
--
-- Etapa de infraestrutura apenas: esta função ainda não é chamada por
-- nenhum código (o webhook do Mercado Pago que vai chamá-la é uma etapa
-- futura, fora deste escopo). Nenhuma integração de gateway, nenhum
-- checkout de frontend, nenhuma mudança em create_order — o fluxo de
-- WhatsApp (lib/orders.ts → create_order) continua exatamente como está,
-- sem saber que esta função existe.
--
-- Formato do futuro webhook: recebe payment_id + payment_status do
-- Mercado Pago, chama esta função com o order_id correspondente. Tudo
-- dentro de UMA chamada RPC = UMA transação Postgres — qualquer
-- `raise exception` desfaz por completo o que essa chamada já tiver
-- alterado (updates de estoque incluídos), então "verificar antes de
-- alterar qualquer coisa" e "alterar tudo ou nada" são a mesma garantia
-- na prática: não é preciso um bloco explícito de rollback.
--
-- Concorrência (dois cenários distintos, duas defesas distintas):
--
--   1) Duas confirmações do MESMO pedido ao mesmo tempo (ex.: o Mercado
--      Pago reenvia o mesmo webhook antes da primeira chamada terminar).
--      Defesa: `select ... from orders where id = p_order_id for update`
--      logo no início — trava a linha do pedido pelo resto da
--      transação. A segunda chamada espera a primeira commitar, então
--      enxerga status = 'confirmed' e cai no caminho de idempotência
--      (nenhuma baixa de estoque repetida).
--
--   2) Duas confirmações de PEDIDOS DIFERENTES disputando o último
--      item em estoque de um mesmo produto/variante. Defesa: cada linha
--      de products/product_variants é lida com `for update` antes da
--      verificação — trava a linha entre a checagem e o decremento — e
--      o UPDATE final repete a condição (`stock_quantity >= quantity`)
--      na cláusula WHERE como segundo cinto de segurança, confirmado
--      via GET DIAGNOSTICS (se a linha não foi afetada, a função lança
--      exceção e a transação inteira é desfeita). Estoque nunca fica
--      negativo em nenhum dos dois casos.
--
-- Idempotência: se o mesmo payment_id chegar de novo para o MESMO
-- pedido já confirmado, a função não baixa estoque de novo — devolve
-- sucesso com already_processed = true. Se o mesmo payment_id aparecer
-- associado a um pedido DIFERENTE (nunca deveria acontecer — payment_id
-- é o id do pagamento no gateway, um pagamento pertence a um pedido só),
-- é um erro controlado, não um "sucesso silencioso".
--
-- Segurança: mesmo modelo de create_order() — nenhuma policy pública
-- nova, RLS de orders/order_items/products/product_variants não muda.
-- REVOKE explícito de public/anon/authenticated + GRANT só para
-- service_role (que já ignora RLS): a função só pode ser chamada a
-- partir de um contexto de servidor que tenha a service role key, nunca
-- do client.
create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_payment_id text,
  p_payment_status text
)
returns table (
  order_id uuid,
  already_processed boolean,
  status text,
  payment_status text
)
language plpgsql
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_conflicting_order_id uuid;
  v_item record;
  v_available integer;
  v_updated integer;
begin
  if p_order_id is null then
    raise exception 'confirm_order_payment: p_order_id é obrigatório';
  end if;

  if p_payment_id is null or length(trim(p_payment_id)) = 0 then
    raise exception 'confirm_order_payment: p_payment_id é obrigatório';
  end if;

  -- 1) Pedido existe — e trava a linha pelo resto da transação (ver
  -- comentário de concorrência no topo do arquivo).
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'confirm_order_payment: pedido % não encontrado', p_order_id;
  end if;

  -- 2) payment_id não pertence a outro pedido. Checado antes do caminho
  -- de idempotência abaixo de propósito: a exclusão `id <> p_order_id`
  -- garante que isto nunca dispara para o replay legítimo do MESMO
  -- pedido, só para o caso de conflito real entre pedidos diferentes.
  select id into v_conflicting_order_id
  from public.orders
  where payment_id = p_payment_id
    and id <> p_order_id
  limit 1;

  if v_conflicting_order_id is not null then
    raise exception
      'confirm_order_payment: payment_id % já está associado a outro pedido (%)',
      p_payment_id, v_conflicting_order_id;
  end if;

  -- 3) Pedido ainda não confirmado — com a idempotência (requisito 7)
  -- resolvida aqui dentro, já que "replay do mesmo payment_id no mesmo
  -- pedido já confirmado" é um caso particular de "já está confirmado".
  if v_order.status = 'confirmed' then
    if v_order.payment_id = p_payment_id then
      -- Mesmo pedido, mesmo payment_id, já processado antes: sucesso
      -- idempotente, nenhuma baixa de estoque de novo.
      return query
        select v_order.id, true, v_order.status, v_order.payment_status;
      return;
    end if;

    raise exception
      'confirm_order_payment: pedido % já está confirmado com payment_id diferente (atual=%, recebido=%)',
      p_order_id, v_order.payment_id, p_payment_id;
  end if;

  -- 4) payment_status recebido precisa ser de pagamento aprovado —
  -- únicos valores fora isso que create_order/payment_status já
  -- reconhece (ver migration anterior) não confirmam o pedido nem
  -- baixam estoque.
  if p_payment_status is distinct from 'approved' then
    raise exception
      'confirm_order_payment: payment_status recebido (%) não é ''approved'' — pedido % não confirmado',
      p_payment_status, p_order_id;
  end if;

  -- 5) Verifica estoque de TODOS os itens antes de alterar qualquer
  -- um. product_id/variant_id são lidos com FOR UPDATE aqui — a trava é
  -- tomada já nesta varredura de verificação (não só no update lá
  -- embaixo), fechando a janela de corrida entre "ler estoque" e
  -- "decidir se dá pra decrementar".
  for v_item in
    select oi.id, oi.variant_id, oi.product_id, oi.quantity,
           coalesce(oi.variant_label_snapshot, oi.product_name_snapshot) as label
    from public.order_items oi
    where oi.order_id = p_order_id
  loop
    if v_item.variant_id is not null then
      select stock_quantity into v_available
      from public.product_variants
      where id = v_item.variant_id
      for update;

      if not found then
        raise exception
          'confirm_order_payment: variante % do item % não existe mais',
          v_item.variant_id, v_item.id;
      end if;
    else
      if v_item.product_id is null then
        raise exception
          'confirm_order_payment: item % não tem product_id nem variant_id — não é possível conferir estoque',
          v_item.id;
      end if;

      select stock_quantity into v_available
      from public.products
      where id = v_item.product_id
      for update;

      if not found then
        raise exception
          'confirm_order_payment: produto % do item % não existe mais',
          v_item.product_id, v_item.id;
      end if;
    end if;

    if v_available < v_item.quantity then
      -- Item sem estoque suficiente: lança e sai imediatamente. Nada
      -- foi alterado ainda nesta chamada (só leituras com FOR UPDATE
      -- até aqui), e o raise desfaz a transação por completo — orders
      -- e estoque ficam exatamente como estavam antes da chamada.
      raise exception
        'confirm_order_payment: estoque insuficiente para "%": disponível=%, pedido=%',
        v_item.label, v_available, v_item.quantity;
    end if;
  end loop;

  -- 6) Todos os itens têm estoque — decrementa atomicamente. As linhas
  -- já estão travadas (FOR UPDATE acima), então nenhuma outra
  -- transação pôde mexer no mesmo stock_quantity nesse meio-tempo; a
  -- condição repetida no WHERE + GET DIAGNOSTICS é o segundo cinto de
  -- segurança contra estoque negativo, não a única defesa.
  for v_item in
    select oi.id, oi.variant_id, oi.product_id, oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
  loop
    if v_item.variant_id is not null then
      update public.product_variants
      set stock_quantity = stock_quantity - v_item.quantity,
          updated_at = now()
      where id = v_item.variant_id
        and stock_quantity >= v_item.quantity;
    else
      update public.products
      set stock_quantity = stock_quantity - v_item.quantity,
          updated_at = now()
      where id = v_item.product_id
        and stock_quantity >= v_item.quantity;
    end if;

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception
        'confirm_order_payment: falha ao decrementar estoque do item % (condição de corrida inesperada)',
        v_item.id;
    end if;
  end loop;

  update public.orders
  set payment_id = p_payment_id,
      payment_status = 'approved',
      status = 'confirmed',
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return query
    select v_order.id, false, v_order.status, v_order.payment_status;
end;
$$;

revoke all on function public.confirm_order_payment(uuid, text, text) from public;
revoke all on function public.confirm_order_payment(uuid, text, text) from anon, authenticated;
grant execute on function public.confirm_order_payment(uuid, text, text) to service_role;
