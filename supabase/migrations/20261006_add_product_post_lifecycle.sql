BEGIN;

ALTER TABLE public.product_posts
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS rating numeric
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

UPDATE public.product_posts
SET published_at = created_at
WHERE published_at IS NULL
  AND status IN ('live', 'over');

CREATE INDEX IF NOT EXISTS product_posts_published_at_idx
  ON public.product_posts (published_at);

CREATE OR REPLACE FUNCTION public.set_product_posts_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('live', 'over') AND NEW.published_at IS NULL THEN
    NEW.published_at = CASE
      WHEN TG_OP = 'UPDATE' THEN OLD.published_at
      ELSE now()
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_posts_set_lifecycle ON public.product_posts;
CREATE TRIGGER product_posts_set_lifecycle
BEFORE INSERT OR UPDATE ON public.product_posts
FOR EACH ROW
EXECUTE FUNCTION public.set_product_posts_lifecycle();

COMMIT;
