-- Add missing UPDATE and DELETE policies for inventory_movements to allow editing batch/dates
DROP POLICY IF EXISTS "authenticated_update_movements" ON public.inventory_movements;
CREATE POLICY "authenticated_update_movements" ON public.inventory_movements
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_movements" ON public.inventory_movements;
CREATE POLICY "authenticated_delete_movements" ON public.inventory_movements
  FOR DELETE TO authenticated USING (true);

-- Relax the quantity check to allow 0 for metadata-only movements (like batch/expiry updates on items with 0 stock)
ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_quantity_check;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_quantity_check CHECK (quantity >= 0);
