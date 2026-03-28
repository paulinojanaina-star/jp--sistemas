ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS birth_date DATE;

ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_category_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_category_check CHECK (category = ANY (ARRAY['MEDICO'::text, 'ENFERMEIRO'::text, 'AUXILIAR'::text, 'TECNICO'::text, 'AGENTE'::text, 'GERENTE'::text]));
