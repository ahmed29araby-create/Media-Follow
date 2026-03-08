
-- Subscriptions table to track org subscription periods
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  months integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  granted_by uuid REFERENCES auth.users(id),
  payment_method text NOT NULL DEFAULT 'vodafone_cash',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Subscription payment requests (pending approval)
CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  months integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  sender_phone text,
  screenshot_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment_screenshots', 'payment_screenshots', false);

-- RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage subscriptions"
ON public.subscriptions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Org members view own subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()));

-- RLS for subscription_payments
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage payments"
ON public.subscription_payments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins insert own org payments"
ON public.subscription_payments FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Admins view own org payments"
ON public.subscription_payments FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id = get_user_organization_id(auth.uid())
);

-- Storage RLS for payment screenshots
CREATE POLICY "Admins upload screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment_screenshots'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Super admins view screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment_screenshots'
  AND (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);
