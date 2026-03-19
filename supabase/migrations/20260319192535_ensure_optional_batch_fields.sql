ALTER TABLE public.inventory_movements
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE;
