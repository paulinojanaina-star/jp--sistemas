DO $$ 
BEGIN
  -- Atualizar a constraint de tipos de ausência para incluir ATESTADO
  ALTER TABLE public.time_off_requests DROP CONSTRAINT IF EXISTS time_off_requests_type_check;
  ALTER TABLE public.time_off_requests ADD CONSTRAINT time_off_requests_type_check CHECK (type IN ('FERIAS', 'FOLGA', 'ATESTADO'));
END $$;
