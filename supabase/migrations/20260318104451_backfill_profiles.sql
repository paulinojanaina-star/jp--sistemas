-- Sincroniza usuários existentes da tabela auth.users para a tabela public.profiles
-- Isso resolve o erro de foreign key 'inventory_movements_responsible_id_fkey'
-- para usuários que foram criados antes do trigger 'on_auth_user_created' ser adicionado.
DO $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  SELECT id, email, raw_user_meta_data->>'name'
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.profiles)
  ON CONFLICT (id) DO NOTHING;
END $$;
