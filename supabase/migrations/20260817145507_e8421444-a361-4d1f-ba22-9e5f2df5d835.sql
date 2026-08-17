ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider_payment_intent text;

CREATE INDEX IF NOT EXISTS idx_payments_payment_intent
  ON public.payments(provider_payment_intent);

UPDATE public.courses
SET subscription_enabled = true,
    monthly_price_cents = 2900,
    yearly_price_cents = 24900
WHERE slug = 'ecommerce-formation';