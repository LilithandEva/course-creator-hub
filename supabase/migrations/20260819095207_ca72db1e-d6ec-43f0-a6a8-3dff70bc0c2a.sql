ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS compare_at_price_cents integer;