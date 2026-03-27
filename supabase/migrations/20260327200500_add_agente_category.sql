DO $$
BEGIN
  -- Drop the old constraint
  ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_category_check;
  
  -- Re-add the constraint with the new 'AGENTE' category
  ALTER TABLE public.employees ADD CONSTRAINT employees_category_check 
    CHECK (category IN ('MEDICO', 'ENFERMEIRO', 'AUXILIAR', 'TECNICO', 'AGENTE'));
END $$;
