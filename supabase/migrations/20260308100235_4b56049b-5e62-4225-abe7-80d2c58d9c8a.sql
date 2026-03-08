CREATE POLICY "Admins update own org"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND id = get_user_organization_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND id = get_user_organization_id(auth.uid())
);