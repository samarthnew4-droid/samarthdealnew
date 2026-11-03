BEGIN;

ALTER TABLE public.product_posts
  ADD COLUMN IF NOT EXISTS serial_number bigint;

CREATE SEQUENCE IF NOT EXISTS public.product_posts_serial_number_seq;
ALTER SEQUENCE public.product_posts_serial_number_seq
  OWNED BY public.product_posts.serial_number;

WITH current_max AS (
  SELECT COALESCE(MAX(serial_number), 0) AS value
  FROM public.product_posts
),
missing_serials AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS position
  FROM public.product_posts
  WHERE serial_number IS NULL
)
UPDATE public.product_posts AS product_post
SET serial_number = current_max.value + missing_serials.position
FROM current_max, missing_serials
WHERE product_post.id = missing_serials.id;

SELECT setval(
  'public.product_posts_serial_number_seq',
  GREATEST(COALESCE(MAX(serial_number), 0), 1),
  COALESCE(MAX(serial_number), 0) > 0
)
FROM public.product_posts;

ALTER TABLE public.product_posts
  ALTER COLUMN serial_number SET DEFAULT nextval('public.product_posts_serial_number_seq'),
  ALTER COLUMN serial_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_posts_serial_number_key
  ON public.product_posts (serial_number);

GRANT USAGE, SELECT ON SEQUENCE public.product_posts_serial_number_seq TO authenticated;

COMMIT;
