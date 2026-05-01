CREATE OR REPLACE FUNCTION public.clear_expiry_dates_on_zero_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.current_quantity <= 0 AND OLD.current_quantity > 0 THEN
    UPDATE public.inventory_movements
    SET expiry_date = NULL,
        batch_number = NULL,
        manufacturing_date = NULL
    WHERE item_id = NEW.id
      AND (expiry_date IS NOT NULL OR batch_number IS NOT NULL OR manufacturing_date IS NOT NULL);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_clear_expiry_dates ON public.items;
CREATE TRIGGER trigger_clear_expiry_dates
AFTER UPDATE OF current_quantity ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.clear_expiry_dates_on_zero_stock();
