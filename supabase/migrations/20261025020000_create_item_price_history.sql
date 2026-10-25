-- Migration: create_item_price_history
-- Description: Cria tabela item_price_history para armazenar curva e evolução de preços por fornecedor ao longo das compras

CREATE TABLE IF NOT EXISTS public.item_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  purchase_order_item_id UUID REFERENCES public.purchase_order_items(id) ON DELETE SET NULL,
  request_number TEXT,
  supplier TEXT,
  health_unit_name TEXT,
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price NUMERIC NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  source_type TEXT NOT NULL DEFAULT 'PURCHASE_ORDER', -- 'PURCHASE_ORDER', 'RECEIPT', 'MANUAL_ADJUSTMENT'
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_item_price_history_item_id ON public.item_price_history (item_id);
CREATE INDEX IF NOT EXISTS idx_item_price_history_supplier ON public.item_price_history (supplier);
CREATE INDEX IF NOT EXISTS idx_item_price_history_date ON public.item_price_history (record_date DESC);
CREATE INDEX IF NOT EXISTS idx_item_price_history_po ON public.item_price_history (purchase_order_id);

-- Enable RLS
ALTER TABLE public.item_price_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
DROP POLICY IF EXISTS "authenticated_select_item_price_history" ON public.item_price_history;
CREATE POLICY "authenticated_select_item_price_history" ON public.item_price_history
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_item_price_history" ON public.item_price_history;
CREATE POLICY "authenticated_insert_item_price_history" ON public.item_price_history
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_item_price_history" ON public.item_price_history;
CREATE POLICY "authenticated_update_item_price_history" ON public.item_price_history
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_item_price_history" ON public.item_price_history;
CREATE POLICY "authenticated_delete_item_price_history" ON public.item_price_history
  FOR DELETE TO authenticated USING (true);

-- Backfill from existing purchase_order_items that have unit_price > 0
DO $$
BEGIN
  INSERT INTO public.item_price_history (
    item_id,
    purchase_order_id,
    purchase_order_item_id,
    request_number,
    supplier,
    health_unit_name,
    unit_price,
    quantity,
    total_price,
    source_type,
    record_date,
    created_at
  )
  SELECT
    poi.item_id,
    po.id,
    poi.id,
    po.request_number,
    COALESCE(po.supplier, 'Não informado'),
    COALESCE(po.health_unit_name, 'Almoxarifado Central'),
    poi.unit_price,
    poi.quantity_ordered,
    poi.total_price,
    CASE WHEN poi.status = 'RECEIVED' THEN 'RECEIPT' ELSE 'PURCHASE_ORDER' END,
    COALESCE(po.requested_at, CURRENT_DATE),
    poi.created_at
  FROM public.purchase_order_items poi
  JOIN public.purchase_orders po ON po.id = poi.purchase_order_id
  WHERE poi.unit_price > 0
    AND NOT EXISTS (
      SELECT 1 FROM public.item_price_history iph
      WHERE iph.purchase_order_item_id = poi.id
    );

  -- For items that have unit_price > 0 on items table and NO history yet, add an initial baseline point
  INSERT INTO public.item_price_history (
    item_id,
    supplier,
    unit_price,
    quantity,
    total_price,
    source_type,
    record_date,
    created_at
  )
  SELECT
    i.id,
    COALESCE(i.supplier, 'Cadastro Inicial'),
    i.unit_price,
    GREATEST(COALESCE(i.current_quantity, 1), 1),
    i.unit_price * GREATEST(COALESCE(i.current_quantity, 1), 1),
    'INITIAL_CATALOG',
    i.created_at::date,
    i.created_at
  FROM public.items i
  WHERE i.unit_price > 0
    AND NOT EXISTS (
      SELECT 1 FROM public.item_price_history iph
      WHERE iph.item_id = i.id
    );
END $$;
