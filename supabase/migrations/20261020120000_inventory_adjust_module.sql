-- Migration: Adicionar suporte ao módulo de Ajuste de Inventário (Contagem Manual)
-- Tipos de movimentação: INVENTORY_ADJUST_IN e INVENTORY_ADJUST_OUT
-- Tabelas: inventory_audit_sessions e inventory_audit_session_items
-- Atualização de triggers para atualizar o saldo dos itens corretamente

DO $$
BEGIN
  -- 1. Atualizar constraint de tipo em inventory_movements para permitir os novos tipos de ajuste
  ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_type_check;
  ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_type_check 
    CHECK (type IN ('IN', 'OUT', 'SPECIAL_OUT', 'INVENTORY_ADJUST_IN', 'INVENTORY_ADJUST_OUT'));
END $$;

-- 2. Tabela de Sessões de Inventário (Auditoria de Contagem Manual)
CREATE TABLE IF NOT EXISTS public.inventory_audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_unit_name TEXT NOT NULL,
  responsible_id UUID REFERENCES public.profiles(id) NOT NULL,
  justification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED', 'DRAFT' etc.
  total_items_checked INTEGER NOT NULL DEFAULT 0,
  divergent_items_count INTEGER NOT NULL DEFAULT 0,
  positive_adjustments_count INTEGER NOT NULL DEFAULT 0,
  negative_adjustments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Itens da Sessão de Inventário
CREATE TABLE IF NOT EXISTS public.inventory_audit_session_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.inventory_audit_sessions(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  system_quantity NUMERIC NOT NULL,
  counted_quantity NUMERIC NOT NULL,
  difference NUMERIC NOT NULL, -- counted - system
  adjustment_type TEXT, -- 'INVENTORY_ADJUST_IN', 'INVENTORY_ADJUST_OUT' ou NULL (se sem divergência)
  movement_id UUID REFERENCES public.inventory_movements(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_inventory_audit_sessions_unit ON public.inventory_audit_sessions(health_unit_name);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_sessions_created ON public.inventory_audit_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_items_session ON public.inventory_audit_session_items(session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audit_items_item ON public.inventory_audit_session_items(item_id);

-- RLS para inventory_audit_sessions
ALTER TABLE public.inventory_audit_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_audit_sessions" ON public.inventory_audit_sessions;
CREATE POLICY "authenticated_select_audit_sessions" ON public.inventory_audit_sessions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_audit_sessions" ON public.inventory_audit_sessions;
CREATE POLICY "authenticated_insert_audit_sessions" ON public.inventory_audit_sessions
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_audit_sessions" ON public.inventory_audit_sessions;
CREATE POLICY "authenticated_update_audit_sessions" ON public.inventory_audit_sessions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_audit_sessions" ON public.inventory_audit_sessions;
CREATE POLICY "authenticated_delete_audit_sessions" ON public.inventory_audit_sessions
  FOR DELETE TO authenticated USING (true);

-- RLS para inventory_audit_session_items
ALTER TABLE public.inventory_audit_session_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_select_audit_session_items" ON public.inventory_audit_session_items;
CREATE POLICY "authenticated_select_audit_session_items" ON public.inventory_audit_session_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_insert_audit_session_items" ON public.inventory_audit_session_items;
CREATE POLICY "authenticated_insert_audit_session_items" ON public.inventory_audit_session_items
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_update_audit_session_items" ON public.inventory_audit_session_items;
CREATE POLICY "authenticated_update_audit_session_items" ON public.inventory_audit_session_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_delete_audit_session_items" ON public.inventory_audit_session_items;
CREATE POLICY "authenticated_delete_audit_session_items" ON public.inventory_audit_session_items
  FOR DELETE TO authenticated USING (true);

-- 3. Atualizar as triggers de processamento de estoque para suportar INVENTORY_ADJUST_IN e INVENTORY_ADJUST_OUT
CREATE OR REPLACE FUNCTION public.process_inventory_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  current_qty NUMERIC;
BEGIN
  -- Get current quantity
  SELECT current_quantity INTO current_qty FROM public.items WHERE id = NEW.item_id FOR UPDATE;

  -- Saídas normais, especiais e saídas por perda/ajuste de inventário negativo
  IF NEW.type = 'OUT' OR NEW.type = 'SPECIAL_OUT' OR NEW.type = 'INVENTORY_ADJUST_OUT' THEN
    IF current_qty - NEW.quantity < 0 THEN
      RAISE EXCEPTION 'Estoque insuficiente para esta saída. Quantidade atual: %', current_qty;
    END IF;
    UPDATE public.items SET current_quantity = current_quantity - NEW.quantity WHERE id = NEW.item_id;
  -- Entradas normais e entradas por ajuste de inventário positivo
  ELSIF NEW.type = 'IN' OR NEW.type = 'INVENTORY_ADJUST_IN' THEN
    UPDATE public.items SET current_quantity = current_quantity + NEW.quantity WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_inventory_movement_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  current_qty NUMERIC;
BEGIN
  -- Only process if quantity or type changed
  IF OLD.quantity = NEW.quantity AND OLD.type = NEW.type THEN
    RETURN NEW;
  END IF;

  -- Revert old movement
  IF OLD.type = 'OUT' OR OLD.type = 'SPECIAL_OUT' OR OLD.type = 'INVENTORY_ADJUST_OUT' THEN
    UPDATE public.items SET current_quantity = current_quantity + OLD.quantity WHERE id = OLD.item_id;
  ELSIF OLD.type = 'IN' OR OLD.type = 'INVENTORY_ADJUST_IN' THEN
    UPDATE public.items SET current_quantity = current_quantity - OLD.quantity WHERE id = OLD.item_id;
  END IF;

  -- Apply new movement
  SELECT current_quantity INTO current_qty FROM public.items WHERE id = NEW.item_id FOR UPDATE;
  
  IF NEW.type = 'OUT' OR NEW.type = 'SPECIAL_OUT' OR NEW.type = 'INVENTORY_ADJUST_OUT' THEN
    IF current_qty - NEW.quantity < 0 THEN
       -- Revert back to avoid messing up state in error
       IF OLD.type = 'OUT' OR OLD.type = 'SPECIAL_OUT' OR OLD.type = 'INVENTORY_ADJUST_OUT' THEN
         UPDATE public.items SET current_quantity = current_quantity - OLD.quantity WHERE id = OLD.item_id;
       ELSIF OLD.type = 'IN' OR OLD.type = 'INVENTORY_ADJUST_IN' THEN
         UPDATE public.items SET current_quantity = current_quantity + OLD.quantity WHERE id = OLD.item_id;
       END IF;
       RAISE EXCEPTION 'Estoque insuficiente para esta atualização. A quantidade ficaria negativa.';
    END IF;
    UPDATE public.items SET current_quantity = current_quantity - NEW.quantity WHERE id = NEW.item_id;
  ELSIF NEW.type = 'IN' OR NEW.type = 'INVENTORY_ADJUST_IN' THEN
    UPDATE public.items SET current_quantity = current_quantity + NEW.quantity WHERE id = NEW.item_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_inventory_movement_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  IF OLD.type = 'OUT' OR OLD.type = 'SPECIAL_OUT' OR OLD.type = 'INVENTORY_ADJUST_OUT' THEN
    UPDATE public.items SET current_quantity = current_quantity + OLD.quantity WHERE id = OLD.item_id;
  ELSIF OLD.type = 'IN' OR OLD.type = 'INVENTORY_ADJUST_IN' THEN
    UPDATE public.items SET current_quantity = current_quantity - OLD.quantity WHERE id = OLD.item_id;
  END IF;
  RETURN OLD;
END;
$$;
