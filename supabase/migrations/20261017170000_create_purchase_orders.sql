-- Migration: Create purchase_orders table with partial receiving support and RLS
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity_ordered NUMERIC NOT NULL CHECK (quantity_ordered > 0),
  quantity_received NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'RECEIVED', 'CANCELLED')),
  supplier TEXT,
  health_unit_name TEXT,
  requested_at DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_purchase_orders_item_id ON public.purchase_orders (item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders (status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_requested_at ON public.purchase_orders (requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_health_unit ON public.purchase_orders (health_unit_name);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_purchase_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER trigger_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_orders_updated_at();

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies matching inventory_movements & items patterns
DROP POLICY IF EXISTS "authenticated_select_purchase_orders" ON public.purchase_orders;
CREATE POLICY "authenticated_select_purchase_orders" ON public.purchase_orders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_purchase_orders" ON public.purchase_orders;
CREATE POLICY "authenticated_insert_purchase_orders" ON public.purchase_orders
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_purchase_orders" ON public.purchase_orders;
CREATE POLICY "authenticated_update_purchase_orders" ON public.purchase_orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_purchase_orders" ON public.purchase_orders;
CREATE POLICY "authenticated_delete_purchase_orders" ON public.purchase_orders
  FOR DELETE TO authenticated USING (true);
