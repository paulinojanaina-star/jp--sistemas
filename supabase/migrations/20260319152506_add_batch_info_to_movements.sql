ALTER TABLE public.inventory_movements
ADD COLUMN batch_number TEXT,
ADD COLUMN manufacturing_date DATE,
ADD COLUMN expiry_date DATE;
