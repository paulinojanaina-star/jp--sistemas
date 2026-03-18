-- Create profiles to handle users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create Items
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  min_quantity NUMERIC DEFAULT 0,
  current_quantity NUMERIC DEFAULT 0,
  unit_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Movements
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  health_unit_name TEXT NOT NULL,
  responsible_id UUID NOT NULL REFERENCES public.profiles(id),
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "authenticated_select_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_select_items" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_items" ON public.items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_items" ON public.items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "authenticated_delete_items" ON public.items FOR DELETE TO authenticated USING (true);

CREATE POLICY "authenticated_select_movements" ON public.inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_movements" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger to update current_quantity and prevent negative stock
CREATE OR REPLACE FUNCTION public.process_inventory_movement()
RETURNS trigger AS $$
DECLARE
  current_qty NUMERIC;
BEGIN
  -- Get current quantity
  SELECT current_quantity INTO current_qty FROM public.items WHERE id = NEW.item_id FOR UPDATE;

  IF NEW.type = 'OUT' THEN
    IF current_qty - NEW.quantity < 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente para esta saída. Quantidade atual: %', current_qty;
    END IF;
    UPDATE public.items SET current_quantity = current_quantity - NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.type = 'IN' THEN
    UPDATE public.items SET current_quantity = current_quantity + NEW.quantity WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_process_movement
  BEFORE INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.process_inventory_movement();

-- Seed Data DO Block
DO $$
DECLARE
  user_1 uuid := gen_random_uuid();
  user_2 uuid := gen_random_uuid();
  item_1 uuid := gen_random_uuid();
  item_2 uuid := gen_random_uuid();
  item_3 uuid := gen_random_uuid();
  item_4 uuid := gen_random_uuid();
  item_5 uuid := gen_random_uuid();
BEGIN
  -- Users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current,
    phone, phone_change, phone_change_token, reauthentication_token
  ) VALUES
  (
    user_1, '00000000-0000-0000-0000-000000000000', 'admin@saude.gov.br',
    crypt('Admin123!', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"name": "Dr. Admin"}',
    false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
  ),
  (
    user_2, '00000000-0000-0000-0000-000000000000', 'enfermeira@saude.gov.br',
    crypt('Enf123!', gen_salt('bf')), NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}', '{"name": "Ana Silva"}',
    false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', ''
  );

  -- Items (Initial current_quantity is 0, so the IN movements below can compute correctly via trigger)
  INSERT INTO public.items (id, name, description, category, min_quantity, current_quantity, unit_type) VALUES
  (item_1, 'Dipirona 500mg', 'Comprimidos', 'Medicação', 50, 0, 'Caixa'),
  (item_2, 'Seringa 5ml', 'Descartável s/ agulha', 'Consumíveis', 200, 0, 'Unidade'),
  (item_3, 'Luvas de Procedimento P', 'Látex', 'EPI', 20, 0, 'Caixa'),
  (item_4, 'Máscara N95', 'Respirador PFF2', 'EPI', 100, 0, 'Unidade'),
  (item_5, 'Soro Fisiológico 0.9%', '500ml', 'Medicação', 150, 0, 'Frasco');

  -- Initial Movements to set stock levels correctly
  INSERT INTO public.inventory_movements (item_id, type, quantity, health_unit_name, responsible_id, observations) VALUES
  (item_1, 'IN', 120, 'Almoxarifado Central', user_1, 'Estoque Inicial'),
  (item_2, 'IN', 150, 'Almoxarifado Central', user_1, 'Estoque Inicial'),
  (item_3, 'IN', 45, 'Almoxarifado Central', user_1, 'Estoque Inicial'),
  (item_4, 'IN', 10, 'Almoxarifado Central', user_1, 'Estoque Inicial'),
  (item_5, 'IN', 300, 'Almoxarifado Central', user_1, 'Estoque Inicial');
END $$;
