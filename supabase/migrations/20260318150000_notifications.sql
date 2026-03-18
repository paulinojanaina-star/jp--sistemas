CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_notifications" ON public.notifications 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_update_notifications" ON public.notifications 
  FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.analyze_consumption_spike()
RETURNS trigger AS $$
DECLARE
  current_month_total NUMERIC := 0;
  prev_month_total NUMERIC := 0;
  increase_pct NUMERIC := 0;
  v_item_name TEXT;
  existing_alert UUID;
BEGIN
  IF NEW.type = 'OUT' THEN
    SELECT name INTO v_item_name FROM public.items WHERE id = NEW.item_id;

    SELECT COALESCE(SUM(quantity), 0) INTO current_month_total
    FROM public.inventory_movements
    WHERE item_id = NEW.item_id
      AND type = 'OUT'
      AND date_trunc('month', created_at) = date_trunc('month', NOW());

    SELECT COALESCE(SUM(quantity), 0) INTO prev_month_total
    FROM public.inventory_movements
    WHERE item_id = NEW.item_id
      AND type = 'OUT'
      AND date_trunc('month', created_at) = date_trunc('month', NOW() - INTERVAL '1 month');

    IF prev_month_total > 0 THEN
      increase_pct := ((current_month_total - prev_month_total) / prev_month_total) * 100;

      IF increase_pct > 20 THEN
        SELECT id INTO existing_alert
        FROM public.notifications
        WHERE item_id = NEW.item_id
          AND type = 'CONSUMPTION_ALERT'
          AND date_trunc('month', created_at) = date_trunc('month', NOW())
        LIMIT 1;

        IF existing_alert IS NULL THEN
          INSERT INTO public.notifications (item_id, title, message, type)
          VALUES (
            NEW.item_id,
            'Alerta de Consumo Elevado',
            'O item ' || v_item_name || ' teve um aumento de ' || TRUNC(increase_pct, 1) || '% no consumo este mês comparado ao mês anterior.',
            'CONSUMPTION_ALERT'
          );
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_consumption_spike ON public.inventory_movements;
CREATE TRIGGER trigger_consumption_spike
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.analyze_consumption_spike();

-- Seed an initial notification for demonstration
DO $$
DECLARE
  v_item_id uuid;
  v_item_name text;
BEGIN
  SELECT id, name INTO v_item_id, v_item_name FROM public.items LIMIT 1;
  
  IF v_item_id IS NOT NULL THEN
    INSERT INTO public.notifications (item_id, title, message, type, created_at)
    VALUES (
      v_item_id,
      'Alerta de Consumo Elevado',
      'O item ' || v_item_name || ' teve um aumento de 25.5% no consumo este mês comparado ao mês anterior.',
      'CONSUMPTION_ALERT',
      NOW() - INTERVAL '2 hours'
    );
  END IF;
END $$;
