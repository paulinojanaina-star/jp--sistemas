CREATE OR REPLACE FUNCTION public.merge_items(source_item_id UUID, destination_item_id UUID)
RETURNS void AS $$
BEGIN
  -- 1. Update all movements to point to the new item
  UPDATE public.inventory_movements
  SET item_id = destination_item_id
  WHERE item_id = source_item_id;

  -- 2. Update notifications to point to the new item
  UPDATE public.notifications
  SET item_id = destination_item_id
  WHERE item_id = source_item_id;

  -- 3. Move current_quantity from source to destination
  UPDATE public.items
  SET current_quantity = current_quantity + (SELECT current_quantity FROM public.items WHERE id = source_item_id)
  WHERE id = destination_item_id;

  -- 4. Delete the source item
  DELETE FROM public.items WHERE id = source_item_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
