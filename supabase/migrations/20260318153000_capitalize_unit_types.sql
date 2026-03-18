-- Migrate existing items' unit_type to capitalized standard values
UPDATE public.items
SET unit_type = CASE 
  WHEN lower(unit_type) = 'caixa' THEN 'Caixa'
  WHEN lower(unit_type) = 'unidade' THEN 'Unidade'
  WHEN lower(unit_type) = 'rolo' THEN 'Rolo'
  WHEN lower(unit_type) = 'litro' THEN 'Litro'
  WHEN lower(unit_type) = 'frasco' THEN 'Frasco'
  WHEN lower(unit_type) = 'par' THEN 'Par'
  ELSE unit_type
END;
