-- Create table for member subfolders
CREATE TABLE public.member_subfolders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate folder names per user
ALTER TABLE public.member_subfolders ADD CONSTRAINT unique_user_subfolder UNIQUE (user_id, folder_name);

-- Enable RLS
ALTER TABLE public.member_subfolders ENABLE ROW LEVEL SECURITY;

-- Members can view and manage their own subfolders
CREATE POLICY "Members manage own subfolders"
ON public.member_subfolders
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view org member subfolders
CREATE POLICY "Admins view org subfolders"
ON public.member_subfolders
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id(auth.uid()))
);