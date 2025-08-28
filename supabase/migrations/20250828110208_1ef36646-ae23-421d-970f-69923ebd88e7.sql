-- Fix function security by setting proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Check if school_users table needs RLS policies
-- Based on the schema, it seems to be missing RLS policies
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for school_users table
CREATE POLICY "Admins can manage school users" 
ON public.school_users 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own school associations" 
ON public.school_users 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Add policy for schools to create school_users when registering
CREATE POLICY "Schools can create their association" 
ON public.school_users 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());