-- Create an index to optimize querying inventory movements by item and type,
-- sorting by created_at DESC to easily find the most recent 'OUT' movement.
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_type_date 
ON public.inventory_movements (item_id, type, created_at DESC);

-- Fix RLS warning for "Janaina Paulino" table
ALTER TABLE public."Janaina Paulino" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_janaina" 
  ON public."Janaina Paulino" 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);
