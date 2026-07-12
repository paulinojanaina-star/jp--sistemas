-- Add indexes to optimize consumption report queries
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at
ON public.inventory_movements (created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_type
ON public.inventory_movements (type);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_health_unit_name
ON public.inventory_movements (health_unit_name);
