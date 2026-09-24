-- =============================================================================
-- MIGRACIÓN SQL: Agregar funciones RPC auditadas y de reportes financieros
-- =============================================================================

-- 1. Asegurar la existencia de la tabla order_cancellations
CREATE TABLE IF NOT EXISTS public.order_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id text,
  table_name text,
  user_id uuid REFERENCES public.users(id),
  user_name text,
  cancellation_type text DEFAULT 'parcial',
  reason text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  shift_id uuid REFERENCES public.shifts(id),
  created_at timestamptz DEFAULT now()
);

-- Permisos RLS para order_cancellations
ALTER TABLE public.order_cancellations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura y escritura completa en order_cancellations" ON public.order_cancellations;
CREATE POLICY "Permitir lectura y escritura completa en order_cancellations"
  ON public.order_cancellations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. FUNCIÓN RPC TRANSACCIONAL AUDITADA: save_table_order_audited
CREATE OR REPLACE FUNCTION public.save_table_order_audited(
  p_table_id text,
  p_expected_version bigint,
  p_table jsonb,
  p_items jsonb,
  p_user_id uuid DEFAULT NULL,
  p_action_id text DEFAULT NULL,
  p_reason text DEFAULT 'Modificación de comanda'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
declare
  v_table public.tables%rowtype;
  v_user_name text;
  v_shift_id uuid;
  v_removed_items jsonb;
begin
  -- 1. Insertar fila de la mesa si no existe
  insert into public.tables (
    id, name, area, status, customer_name, assigned_waiter_id, created_at,
    is_bar_account, order_version
  ) values (
    p_table_id,
    coalesce(p_table->>'name', 'Mesa'),
    coalesce(nullif(p_table->>'area', ''), 'Rancho principal'),
    coalesce(p_table->>'status', 'ocupada'),
    coalesce(p_table->>'customer_name', ''),
    nullif(p_table->>'assigned_waiter_id', '')::uuid,
    coalesce(nullif(p_table->>'created_at', '')::timestamptz, now()),
    coalesce((p_table->>'is_bar_account')::boolean, false),
    0
  ) on conflict (id) do nothing;

  -- 2. Bloqueo exclusivo para evitar carreras de concurrencia
  select * into v_table
  from public.tables
  where id = p_table_id
  for update;

  -- 3. Verificación de versión (Control de Concurrencia Optimista)
  if p_expected_version is null or v_table.order_version <> p_expected_version then
    raise exception 'TABLE_ORDER_CONFLICT'
      using errcode = '40001',
            detail = format('Expected version %s but current version is %s', p_expected_version, v_table.order_version);
  end if;

  -- 4. Obtener turno activo y nombre de usuario para auditoría
  select id into v_shift_id
  from public.shifts
  where closed_at is null
  order by opened_at desc
  limit 1;

  if p_user_id is not null then
    select name into v_user_name from public.users where id = p_user_id;
  end if;

  -- 5. Detectar ítems eliminados o reducidos comparando órdenes previas vs p_items
  with old_orders as (
    select o.product_id, p.name as product_name, o.quantity
    from public.orders o
    left join public.products p on p.id = o.product_id
    where o.table_id = p_table_id
  ),
  new_orders as (
    select
      (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::numeric as quantity
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item
  ),
  removed as (
    select
      o.product_id,
      coalesce(o.product_name, 'Producto') as product_name,
      (o.quantity - coalesce(n.quantity, 0)) as removed_qty
    from old_orders o
    left join new_orders n on o.product_id = n.product_id
    where o.quantity > coalesce(n.quantity, 0)
  )
  select jsonb_agg(
    jsonb_build_object(
      'product_id', product_id,
      'product_name', product_name,
      'quantity', removed_qty
    )
  ) into v_removed_items
  from removed;

  -- 6. Registrar auditoría si hubo productos removidos/reducidos
  if v_removed_items is not null and jsonb_array_length(v_removed_items) > 0 then
    insert into public.order_cancellations (
      table_id, table_name, user_id, user_name, cancellation_type, reason, items, shift_id
    ) values (
      p_table_id,
      coalesce(p_table->>'name', v_table.name),
      p_user_id,
      v_user_name,
      'parcial',
      coalesce(p_reason, 'Modificación de comanda'),
      v_removed_items,
      v_shift_id
    );
  end if;

  -- 7. Actualizar metadata de la mesa e incrementar orden de versión
  update public.tables
  set name = coalesce(p_table->>'name', v_table.name),
      area = coalesce(nullif(p_table->>'area', ''), v_table.area, 'Rancho principal'),
      status = coalesce(p_table->>'status', v_table.status),
      customer_name = coalesce(p_table->>'customer_name', v_table.customer_name),
      assigned_waiter_id = coalesce(nullif(p_table->>'assigned_waiter_id', '')::uuid, v_table.assigned_waiter_id),
      is_bar_account = coalesce((p_table->>'is_bar_account')::boolean, v_table.is_bar_account),
      order_version = v_table.order_version + 1
  where id = p_table_id;

  -- 8. Reemplazar comandas de la mesa atómicamente
  delete from public.orders where table_id = p_table_id;

  insert into public.orders (table_id, product_id, quantity, is_printed)
  select
    p_table_id,
    (item->>'product_id')::uuid,
    (item->>'quantity')::numeric,
    coalesce((item->>'is_printed')::boolean, true)
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;

  return jsonb_build_object('order_version', v_table.order_version + 1);
end;
$$;

GRANT EXECUTE ON FUNCTION public.save_table_order_audited(text, bigint, jsonb, jsonb, uuid, text, text) TO anon, authenticated;

-- 3. FUNCIÓN RPC AUDITADA: cancel_table_order_audited
DROP FUNCTION IF EXISTS public.cancel_table_order_audited(text, uuid, text, text);

CREATE OR REPLACE FUNCTION public.cancel_table_order_audited(
  p_table_id text,
  p_user_id uuid DEFAULT NULL,
  p_action_id text DEFAULT NULL,
  p_reason text DEFAULT 'Cancelación de mesa',
  p_items jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
declare
  v_table_name text;
  v_user_name text;
  v_shift_id uuid;
  v_items jsonb;
begin
  select name into v_table_name from public.tables where id = p_table_id;

  if p_user_id is not null then
    select name into v_user_name from public.users where id = p_user_id;
  end if;

  select id into v_shift_id
  from public.shifts
  where closed_at is null
  order by opened_at desc
  limit 1;

  if p_items is not null and jsonb_array_length(p_items) > 0 then
    v_items := p_items;
  else
    select jsonb_agg(
      jsonb_build_object(
        'product_id', o.product_id,
        'product_name', coalesce(p.name, 'Producto'),
        'quantity', o.quantity
      )
    ) into v_items
    from public.orders o
    left join public.products p on p.id = o.product_id
    where o.table_id = p_table_id;
  end if;

  if v_items is not null and jsonb_array_length(v_items) > 0 then
    insert into public.order_cancellations (
      table_id, table_name, user_id, user_name, cancellation_type, reason, items, shift_id
    ) values (
      p_table_id,
      coalesce(v_table_name, p_table_id),
      p_user_id,
      v_user_name,
      'total',
      coalesce(p_reason, 'Cancelación de mesa'),
      v_items,
      v_shift_id
    );
  end if;

  delete from public.orders where table_id = p_table_id;
  delete from public.tables where id = p_table_id;

  return jsonb_build_object('success', true);
end;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_table_order_audited(text, uuid, text, text, jsonb) TO anon, authenticated;

-- 4. FUNCIÓN RPC AUDITORÍA DESGLOSADA: get_order_cancellations
DROP FUNCTION IF EXISTS public.get_order_cancellations(uuid, timestamptz, timestamptz, uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_order_cancellations(
  p_user_id uuid DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_shift_id uuid DEFAULT NULL,
  p_cancellation_type text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  table_id text,
  table_name text,
  area text,
  product_name text,
  quantity numeric,
  cancellation_type text,
  cancelled_by_name text,
  waiter_name text,
  reason text,
  shift_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.table_id,
    c.table_name,
    COALESCE(t.area, 'Rancho principal') AS area,
    COALESCE(item->>'product_name', '-') AS product_name,
    COALESCE((item->>'quantity')::numeric, 0) AS quantity,
    c.cancellation_type,
    COALESCE(c.user_name, u.name, 'Sistema') AS cancelled_by_name,
    COALESCE(w.name, 'Sin mesero') AS waiter_name,
    c.reason,
    c.shift_id,
    c.created_at
  FROM public.order_cancellations c
  LEFT JOIN public.tables t ON t.id = c.table_id
  LEFT JOIN public.users u ON u.id = c.user_id
  LEFT JOIN public.users w ON w.id = t.assigned_waiter_id
  LEFT JOIN LATERAL jsonb_array_elements(
    CASE 
      WHEN c.items IS NULL OR jsonb_array_length(c.items) = 0 
      THEN '[{"product_name": "-", "quantity": 0}]'::jsonb 
      ELSE c.items 
    END
  ) AS item ON true
  WHERE (p_start_date IS NULL OR c.created_at >= p_start_date)
    AND (p_end_date IS NULL OR c.created_at <= p_end_date)
    AND (p_shift_id IS NULL OR c.shift_id = p_shift_id)
    AND (p_cancellation_type IS NULL OR c.cancellation_type = p_cancellation_type)
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_cancellations(uuid, timestamptz, timestamptz, uuid, text, integer, integer) TO anon, authenticated;

-- 5. FUNCIÓN RPC REPORTE FINANCIERO: get_financial_report
CREATE OR REPLACE FUNCTION public.get_financial_report(
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
declare
  v_total_sales numeric(12,2) := 0.00;
  v_total_cost numeric(12,2) := 0.00;
  v_total_expenses numeric(12,2) := 0.00;
  v_gross_profit numeric(12,2) := 0.00;
  v_net_profit numeric(12,2) := 0.00;
  v_net_margin numeric(12,2) := 0.00;
  v_invoices jsonb;
  v_products jsonb;
begin
  select coalesce(sum(total), 0.00)
  into v_total_sales
  from public.invoices
  where created_at >= p_start_date and created_at <= p_end_date;

  select coalesce(sum(ii.quantity * coalesce(ii.cost_at_sale, 0.00)), 0.00)
  into v_total_cost
  from public.invoice_items ii
  join public.invoices i on i.id = ii.invoice_id
  where i.created_at >= p_start_date and i.created_at <= p_end_date;

  select coalesce(sum(amount), 0.00)
  into v_total_expenses
  from public.expenses
  where created_at >= p_start_date and created_at <= p_end_date;

  v_gross_profit := v_total_sales - v_total_cost;
  v_net_profit := v_gross_profit - v_total_expenses;
  
  if v_total_sales > 0 then
    v_net_margin := (v_net_profit / v_total_sales) * 100.0;
  else
    v_net_margin := 0.00;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'table_name', i.table_name,
      'customer_name', i.customer_name,
      'waiter_name', i.waiter_name,
      'cashier_name', i.cashier_name,
      'total', i.total,
      'payment_method', i.payment_method,
      'created_at', i.created_at
    ) order by i.created_at desc
  ), '[]'::jsonb)
  into v_invoices
  from public.invoices i
  where i.created_at >= p_start_date and i.created_at <= p_end_date;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'product_name', p.product_name,
      'total_quantity', p.total_quantity,
      'total_sales', p.total_sales,
      'total_cost', p.total_cost
    ) order by p.total_sales desc
  ), '[]'::jsonb)
  into v_products
  from (
    select
      ii.product_name,
      sum(ii.quantity) as total_quantity,
      sum(ii.quantity * ii.price_at_sale) as total_sales,
      sum(ii.quantity * coalesce(ii.cost_at_sale, 0.00)) as total_cost
    from public.invoice_items ii
    join public.invoices i on i.id = ii.invoice_id
    where i.created_at >= p_start_date and i.created_at <= p_end_date
    group by ii.product_name
  ) p;

  return jsonb_build_object(
    'summary', jsonb_build_object(
      'total_sales', v_total_sales,
      'total_cost', v_total_cost,
      'total_expenses', v_total_expenses,
      'gross_profit', v_gross_profit,
      'net_profit', v_net_profit,
      'net_margin', v_net_margin
    ),
    'invoices', v_invoices,
    'products', v_products
  );
end;
$$;

GRANT EXECUTE ON FUNCTION public.get_financial_report(timestamptz, timestamptz) TO anon, authenticated;
