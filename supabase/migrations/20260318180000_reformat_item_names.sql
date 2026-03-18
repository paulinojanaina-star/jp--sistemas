UPDATE public.items
SET name = trim(regexp_replace(name, '^(\d+)\s+(.*)$', '\2 (\1)'))
WHERE name ~ '^\d+\s+.*$';
