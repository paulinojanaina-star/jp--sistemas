DO $
BEGIN
  -- Drop check constraint safely to allow new type
  ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_type_check;
  
  -- Re-add constraint with SPECIAL_OUT
  ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_type_check CHECK (type IN ('IN', 'OUT', 'SPECIAL_OUT'));
  
  -- Add new columns for special reasons and edit tracking
  ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS special_reason TEXT;
  ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS edit_justification TEXT;
END $;

-- Update the main process movement trigger to handle SPECIAL_OUT
CREATE OR REPLACE FUNCTION public.process_inventory_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_qty NUMERIC;
BEGIN
  -- Get current quantity
  SELECT current_quantity INTO current_qty FROM public.items WHERE id = NEW.item_id FOR UPDATE;

  IF NEW.type = 'OUT' OR NEW.type = 'SPECIAL_OUT' THEN
    IF current_qty - NEW.quantity < 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente para esta saída. Quantidade atual: %', current_qty;
    END IF;
    UPDATE public.items SET current_quantity = current_quantity - NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.type = 'IN' THEN
    UPDATE public.items SET current_quantity = current_quantity + NEW.quantity WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create UPDATE trigger for movements to keep stock synced when history is edited
CREATE OR REPLACE FUNCTION public.process_inventory_movement_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_qty NUMERIC;
BEGIN
  -- Only process if quantity or type changed
  IF OLD.quantity = NEW.quantity AND OLD.type = NEW.type THEN
    RETURN NEW;
  END IF;

  -- Revert old movement
  IF OLD.type = 'OUT' OR OLD.type = 'SPECIAL_OUT' THEN
    UPDATE public.items SET current_quantity = current_quantity + OLD.quantity WHERE id = OLD.item_id;
  ELSIF OLD.type = 'IN' THEN
    UPDATE public.items SET current_quantity = current_quantity - OLD.quantity WHERE id = OLD.item_id;
  END IF;

  -- Apply new movement
  SELECT current_quantity INTO current_qty FROM public.items WHERE id = NEW.item_id FOR UPDATE;
  
  IF NEW.type = 'OUT' OR NEW.type = 'SPECIAL_OUT' THEN
    IF current_qty - NEW.quantity < 0 THEN
       -- Revert back to avoid messing up state in error
       IF OLD.type = 'OUT' OR OLD.type = 'SPECIAL_OUT' THEN
         UPDATE public.items SET current_quantity = current_quantity - OLD.quantity WHERE id = OLD.item_id;
       ELSIF OLD.type = 'IN' THEN
         UPDATE public.items SET current_quantity = current_quantity + OLD.quantity WHERE id = OLD.item_id;
       END IF;
       RAISE EXCEPTION 'Estoque insuficiente para esta atualização. A quantidade ficaria negativa.';
    END IF;
    UPDATE public.items SET current_quantity = current_quantity - NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.type = 'IN' THEN
    UPDATE public.items SET current_quantity = current_quantity + NEW.quantity WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_process_movement_update ON public.inventory_movements;
CREATE TRIGGER trigger_process_movement_update 
  BEFORE UPDATE ON public.inventory_movements 
  FOR EACH ROW EXECUTE FUNCTION process_inventory_movement_update();

-- Create DELETE trigger for movements to keep stock synced if records are removed
CREATE OR REPLACE FUNCTION public.process_inventory_movement_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.type = 'OUT' OR OLD.type = 'SPECIAL_OUT' THEN
    UPDATE public.items SET current_quantity = current_quantity + OLD.quantity WHERE id = OLD.item_id;
  ELSIF OLD.type = 'IN' THEN
    UPDATE public.items SET current_quantity = current_quantity - OLD.quantity WHERE id = OLD.item_id;
  END IF;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_process_movement_delete ON public.inventory_movements;
CREATE TRIGGER trigger_process_movement_delete 
  BEFORE DELETE ON public.inventory_movements 
  FOR EACH ROW EXECUTE FUNCTION process_inventory_movement_delete();
