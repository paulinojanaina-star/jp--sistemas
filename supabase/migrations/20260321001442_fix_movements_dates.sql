-- Extra safety to ensure the batch columns definitely exist
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS batch_number TEXT;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS manufacturing_date DATE;
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS expiry_date DATE;
