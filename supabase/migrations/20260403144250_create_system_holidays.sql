DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.system_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL DEFAULT 'PONTO_FACULTATIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- RLS
  ALTER TABLE public.system_holidays ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "authenticated_select_system_holidays" ON public.system_holidays;
  CREATE POLICY "authenticated_select_system_holidays" ON public.system_holidays FOR SELECT TO authenticated USING (true);

  DROP POLICY IF EXISTS "authenticated_insert_system_holidays" ON public.system_holidays;
  CREATE POLICY "authenticated_insert_system_holidays" ON public.system_holidays FOR INSERT TO authenticated WITH CHECK (true);

  DROP POLICY IF EXISTS "authenticated_update_system_holidays" ON public.system_holidays;
  CREATE POLICY "authenticated_update_system_holidays" ON public.system_holidays FOR UPDATE TO authenticated USING (true);

  DROP POLICY IF EXISTS "authenticated_delete_system_holidays" ON public.system_holidays;
  CREATE POLICY "authenticated_delete_system_holidays" ON public.system_holidays FOR DELETE TO authenticated USING (true);
END $$;
