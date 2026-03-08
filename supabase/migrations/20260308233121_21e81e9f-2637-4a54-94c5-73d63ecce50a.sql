
-- Add referral_code_used column to track which discount code was used at subscription time
ALTER TABLE public.subscription_payments ADD COLUMN IF NOT EXISTS referral_code_used text DEFAULT NULL;

-- Update the RLS policy to also allow reading user_discount_percentage
DROP POLICY IF EXISTS "Authenticated read referral settings" ON public.admin_settings;
CREATE POLICY "Authenticated read referral settings"
ON public.admin_settings FOR SELECT TO authenticated
USING (
  setting_key IN ('referral_percentage', 'credit_expiry_months', 'user_discount_percentage')
  AND organization_id IS NULL
);
