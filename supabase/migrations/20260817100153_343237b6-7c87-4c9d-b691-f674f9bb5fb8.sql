-- 1. Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Webhook event ledger (idempotency + debugging)
CREATE TABLE public.webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  payload jsonb,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_events_admin_read ON public.webhook_events
  FOR SELECT TO authenticated USING (public.is_admin());

-- 3. Pending access for guest purchases
CREATE TABLE public.pending_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  stripe_session_id text,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_pending_access_email_course
  ON public.pending_access(lower(email), course_id);
GRANT SELECT ON public.pending_access TO authenticated;
GRANT ALL ON public.pending_access TO service_role;
ALTER TABLE public.pending_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY pending_access_admin_read ON public.pending_access
  FOR SELECT TO authenticated USING (public.is_admin());

-- 4. Course pricing extensions
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS subscription_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monthly_price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yearly_price_cents integer NOT NULL DEFAULT 0;

-- 5. Completion email dedupe
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS completion_email_sent_at timestamptz;

-- 6. Payments refund tracking
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_url text;

-- 7. Entitlement: subscriptions count as access
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND (s.course_id = _course_id OR s.course_id IS NULL)
      AND (
        (s.status IN ('active','trialing','past_due')
          AND (s.current_period_end IS NULL OR s.current_period_end > now()))
        OR (s.status = 'canceled' AND s.current_period_end > now())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_course_access(_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.enrollments e
                 WHERE e.course_id = _course_id AND e.user_id = auth.uid())
      OR public.has_active_subscription(auth.uid(), _course_id);
$$;

-- 8. Claim pending access on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.enrollments (user_id, course_id, source, stripe_session_id)
  SELECT NEW.id, pa.course_id, 'stripe', pa.stripe_session_id
  FROM public.pending_access pa
  WHERE lower(pa.email) = lower(NEW.email) AND pa.claimed_at IS NULL
  ON CONFLICT DO NOTHING;

  UPDATE public.pending_access
  SET claimed_at = now()
  WHERE lower(email) = lower(NEW.email) AND claimed_at IS NULL;

  RETURN NEW;
END;
$$;