-- Migration: Add unit_price and total_price to purchase_orders table
-- Idempotent ALTER TABLE to support unit price and invoice total calculation

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2) DEFAULT 0 CHECK (unit_price >= 0),
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(12, 2) DEFAULT 0 CHECK (total_price >= 0);
