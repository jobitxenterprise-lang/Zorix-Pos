-- =============================================================================
-- ESQUEMA Y ESTRUCTURA COMPLETA PARA ZORIX POS (Supabase PostgreSQL)
-- =============================================================================
-- Instrucciones: 
-- Copia y ejecuta este script en el Editor SQL (SQL Editor) de tu nueva consola Supabase.
-- =============================================================================

-- 1. Usuarios (users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'mesero',
  is_active boolean DEFAULT true
);

-- 2. Categorías (categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text
);

-- 3. Productos (products)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id text REFERENCES public.categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL DEFAULT 0.00,
  cost numeric(10,2) DEFAULT 0.00,
  stock integer DEFAULT NULL,
  icon_path text,
  is_active boolean DEFAULT true,
  print_type text DEFAULT 'cocina'
);

-- 4. Promociones / Combos (product_bundles)
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id bigserial PRIMARY KEY,
  promotion_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  base_product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_to_deduct numeric NOT NULL DEFAULT 1
);

-- 5. Turnos (shifts)
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  opened_by uuid REFERENCES public.users(id),
  closed_by uuid REFERENCES public.users(id),
  total_expected numeric(12,2),
  total_real numeric(12,2),
  difference numeric(12,2)
);

-- 6. Mesas y Cuentas Activas (tables)
CREATE TABLE IF NOT EXISTS public.tables (
  id text PRIMARY KEY,
  name text NOT NULL,
  area text DEFAULT 'Rancho principal',
  status text NOT NULL DEFAULT 'libre',
  customer_name text DEFAULT '',
  assigned_waiter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_bar_account boolean DEFAULT false,
  order_version bigint DEFAULT 0
);

-- 7. Comandas (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id bigserial PRIMARY KEY,
  table_id text REFERENCES public.tables(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  is_printed boolean DEFAULT false
);

-- 8. Facturas (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
  id text PRIMARY KEY,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  table_name text,
  customer_name text,
  waiter_name text,
  cashier_name text,
  total numeric(10,2) NOT NULL DEFAULT 0.00,
  payment_method text NOT NULL DEFAULT 'Efectivo',
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

-- 9. Ítems de Facturas (invoice_items)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  price_at_sale numeric(10,2) NOT NULL DEFAULT 0.00,
  cost_at_sale numeric(10,2) DEFAULT 0.00
);

-- 10. Gastos (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0.00,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'otros',
  is_paid boolean DEFAULT true,
  notification_date date,
  created_at timestamptz DEFAULT now()
);

-- 11. Ajustes Globales (settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- =============================================================================
-- ÍNDICES B-TREE DE RENDIMIENTO
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders (table_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders (product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_shift_id ON public.invoices (shift_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shift_id ON public.expenses (shift_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_tables_assigned_waiter_id ON public.tables (assigned_waiter_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_promotion_id ON public.product_bundles (promotion_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_base_product_id ON public.product_bundles (base_product_id);
CREATE INDEX IF NOT EXISTS idx_shifts_opened_by ON public.shifts (opened_by);
CREATE INDEX IF NOT EXISTS idx_shifts_closed_by ON public.shifts (closed_by);

-- =============================================================================
-- FUNCIÓN RPC TRANSACCIONAL: save_table_order
-- =============================================================================
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

  select * into v_table
  from public.tables
  where id = p_table_id
  for update;

  if p_expected_version is null or v_table.order_version <> p_expected_version then
    raise exception 'TABLE_ORDER_CONFLICT'
      using errcode = '40001',
            detail = format('Expected version %s but current version is %s', p_expected_version, v_table.order_version);
  end if;

  update public.tables
  set name = coalesce(p_table->>'name', v_table.name),
      area = coalesce(nullif(p_table->>'area', ''), v_table.area, 'Rancho principal'),
      status = coalesce(p_table->>'status', v_table.status),
      customer_name = coalesce(p_table->>'customer_name', v_table.customer_name),
      assigned_waiter_id = coalesce(nullif(p_table->>'assigned_waiter_id', '')::uuid, v_table.assigned_waiter_id),
      is_bar_account = coalesce((p_table->>'is_bar_account')::boolean, v_table.is_bar_account),
      order_version = v_table.order_version + 1
  where id = p_table_id;

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
