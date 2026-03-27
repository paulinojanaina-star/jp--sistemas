DO $$
BEGIN
  -- Create employees table
  CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('MEDICO', 'ENFERMEIRO', 'AUXILIAR', 'TECNICO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Create time_off_requests table
  CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('FERIAS', 'FOLGA')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Enable RLS
  ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

  -- Add policies
  DROP POLICY IF EXISTS "authenticated_all_employees" ON public.employees;
  CREATE POLICY "authenticated_all_employees" ON public.employees 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "authenticated_all_time_off" ON public.time_off_requests;
  CREATE POLICY "authenticated_all_time_off" ON public.time_off_requests 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

-- Seed data for testing
DO $$
DECLARE
  emp1 UUID := gen_random_uuid();
  emp2 UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.employees LIMIT 1) THEN
    INSERT INTO public.employees (id, name, category) VALUES
      (emp1, 'Dr. João Silva', 'MEDICO'),
      (emp2, 'Maria Santos', 'ENFERMEIRO'),
      (gen_random_uuid(), 'Carlos Oliveira', 'TECNICO'),
      (gen_random_uuid(), 'Ana Costa', 'AUXILIAR')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.time_off_requests (employee_id, type, start_date, end_date, notes) VALUES
      (emp1, 'FOLGA', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', 'Plantão extra de fim de semana'),
      (emp2, 'FERIAS', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '35 days', 'Férias anuais regulamentares')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
