-- Review only. Do not run this file until approved.
-- Adds only the five nullable display metadata fields used by product_posts.

BEGIN;

ALTER TABLE public.product_posts
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS order_price numeric,
  ADD COLUMN IF NOT EXISTS less_price numeric;

COMMIT;
