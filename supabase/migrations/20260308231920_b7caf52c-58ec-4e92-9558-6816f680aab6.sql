
-- Allow org admins to update their own referral credits (for deducting remaining)
CREATE POLICY "Org admins update own credits"
ON public.referral_credits FOR UPDATE TO authenticated
USING (organization_id = get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Allow org admins to insert subscriptions for their own org (for credit-based auto-subscriptions)
CREATE POLICY "Org admins insert own subscriptions"
ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') 
  AND organization_id = get_user_organization_id(auth.uid())
);
