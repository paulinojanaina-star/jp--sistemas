-- Migration: Add purchase_order_items table for multi-item orders
-- 1. Create table purchase_order_items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity_ordered NUMERIC NOT NULL CHECK (quantity_ordered > 0),
  quantity_received NUMERIC NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'RECEIVED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for purchase_order_items
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON public.purchase_order_items (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_item_id ON public.purchase_order_items (item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_status ON public.purchase_order_items (status);

-- 3. Trigger for updated_at on purchase_order_items
CREATE OR REPLACE FUNCTION public.handle_purchase_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_purchase_order_items_updated_at ON public.purchase_order_items;
CREATE TRIGGER trigger_purchase_order_items_updated_at
  BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_order_items_updated_at();

-- 4. Enable RLS and create policies for purchase_order_items
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "authenticated_select_purchase_order_items" ON public.purchase_order_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "authenticated_insert_purchase_order_items" ON public.purchase_order_items
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "authenticated_update_purchase_order_items" ON public.purchase_order_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "authenticated_delete_purchase_order_items" ON public.purchase_order_items
  FOR DELETE TO authenticated USING (true);

-- 5. Make item_id and quantity_ordered optional on purchase_orders header for future multi-item orders
-- Existing rows retain their values
ALTER TABLE public.purchase_orders ALTER COLUMN item_id DROP NOT NULL;
ALTER TABLE public.purchase_orders ALTER COLUMN quantity_ordered DROP NOT NULL;

-- 6. Backfill existing purchase_orders data into purchase_order_items
-- Only insert if not already backfilled for that purchase_order
INSERT INTO public.purchase_order_items (
  purchase_order_id,
  item_id,
  quantity_ordered,
  quantity_received,
  unit_price,
  total_price,
  status,
  created_at,
  updated_at
)
SELECT
  po.id,
  po.item_id,
  po.quantity_ordered,
  COALESCE(po.quantity_received, 0),
  COALESCE(po.unit_price, 0),
  COALESCE(po.total_price, COALESCE(po.unit_price, 0) * po.quantity_ordered),
  po.status,
  po.created_at,
  po.updated_at
FROM public.purchase_orders po
WHERE po.item_id IS NOT NULL
  AND po.quantity_ordered IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.purchase_order_items poi WHERE poi.purchase_order_id = po.id
  );
