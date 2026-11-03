-- Review only. Do not run this file until the schema and policy design are approved.


BEGIN;

-- 1. Create the product posts table.
CREATE TABLE IF NOT EXISTS public.product_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL
    CHECK (length(trim(image_url)) > 0),
  description text NOT NULL
    CHECK (char_length(trim(description)) BETWEEN 1 AND 10000),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'live', 'over')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for public listings.
CREATE INDEX IF NOT EXISTS product_posts_public_status_created_at_idx
  ON public.product_posts (status, created_at DESC);

-- 3. Automatically update updated_at.
CREATE OR REPLACE FUNCTION public.set_product_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create the trigger only if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'product_posts_set_updated_at'
      AND tgrelid = 'public.product_posts'::regclass
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER product_posts_set_updated_at
    BEFORE UPDATE ON public.product_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_product_posts_updated_at();
  END IF;
END;
$$;

-- 4. Enable row-level security.
ALTER TABLE public.product_posts ENABLE ROW LEVEL SECURITY;

-- 5. Public users can read only live/over posts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_posts'
      AND policyname = 'Public can read live product posts'
  ) THEN
    CREATE POLICY "Public can read live product posts"
    ON public.product_posts
    FOR SELECT
    TO anon, authenticated
    USING (status IN ('live', 'over'));
  END IF;
END;
$$;

-- 6. Only active admins can insert posts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_posts'
      AND policyname = 'Active admins can insert product posts'
  ) THEN
    CREATE POLICY "Active admins can insert product posts"
    ON public.product_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
      )
    );
  END IF;
END;
$$;

-- 7. Only active admins can update posts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_posts'
      AND policyname = 'Active admins can update product posts'
  ) THEN
    CREATE POLICY "Active admins can update product posts"
    ON public.product_posts
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
      )
    );
  END IF;
END;
$$;

-- 8. Only active admins can delete posts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_posts'
      AND policyname = 'Active admins can delete product posts'
  ) THEN
    CREATE POLICY "Active admins can delete product posts"
    ON public.product_posts
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
      )
    );
  END IF;
END;
$$;

-- 9. Storage: allow active admins to upload product images.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Active admins can upload product images'
  ) THEN
    CREATE POLICY "Active admins can upload product images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'product-images'
      AND EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
      )
    );
  END IF;
END;
$$;

-- 10. Storage: allow active admins to update product images.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Active admins can update product images'
  ) THEN
    CREATE POLICY "Active admins can update product images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'product-images'
      AND EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
      )
    )
    WITH CHECK (
      bucket_id = 'product-images'
      AND EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
      )
    );
  END IF;
END;
$$;

-- 11. Storage: allow active admins to delete product images.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Active admins can delete product images'
  ) THEN
    CREATE POLICY "Active admins can delete product images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'product-images'
      AND EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
      )
    );
  END IF;
END;
$$;

COMMIT;
