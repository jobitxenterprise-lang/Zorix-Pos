-- Ensure area column exists on public.tables with default 'Rancho principal'
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS area text DEFAULT 'Rancho principal';
ALTER TABLE public.tables ALTER COLUMN area SET DEFAULT 'Rancho principal';

-- Update existing table records with legacy or null area
UPDATE public.tables SET area = 'Rancho principal' WHERE area IS NULL OR area = 'Rancho Familiar 1';

CREATE OR REPLACE FUNCTION public.save_table_order(
  p_table_id text,
  p_expected_version bigint,
  p_table jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
declare
  v_table public.tables%rowtype;
begin
  -- 1. Insert table row if it does not exist yet, preserving p_table->>'area'
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

  -- 2. Lock row for update to prevent concurrent race conditions
  select * into v_table
  from public.tables
  where id = p_table_id
  for update;

  -- 3. Version check for optimistic concurrency
  if p_expected_version is null or v_table.order_version <> p_expected_version then
    raise exception 'TABLE_ORDER_CONFLICT'
      using errcode = '40001',
            detail = format('Expected version %s but current version is %s', p_expected_version, v_table.order_version);
  end if;

  -- 4. Update table metadata including area
  update public.tables
  set name = coalesce(p_table->>'name', v_table.name),
      area = coalesce(nullif(p_table->>'area', ''), v_table.area, 'Rancho principal'),
      status = coalesce(p_table->>'status', v_table.status),
      customer_name = coalesce(p_table->>'customer_name', v_table.customer_name),
      assigned_waiter_id = coalesce(nullif(p_table->>'assigned_waiter_id', '')::uuid, v_table.assigned_waiter_id),
      is_bar_account = coalesce((p_table->>'is_bar_account')::boolean, v_table.is_bar_account),
      order_version = v_table.order_version + 1
  where id = p_table_id;

  -- 5. Replace table order items atomically
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

GRANT EXECUTE ON FUNCTION public.save_table_order(text, bigint, jsonb, jsonb) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
