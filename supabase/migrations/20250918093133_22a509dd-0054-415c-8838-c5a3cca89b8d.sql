-- Fix RLS policies to prevent role escalation and restrict school contact info

-- 1. Add explicit policy to prevent users from changing their own role
CREATE POLICY "Users cannot update their own role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (
  auth.uid() = user_id AND 
  OLD.role = NEW.role -- Role must remain unchanged
);

-- 2. Drop the overly permissive update policy and replace it
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 3. Create more restrictive update policy for non-role fields only
CREATE POLICY "Users can update profile except role" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  OLD.role = NEW.role AND -- Role cannot be changed
  OLD.user_id = NEW.user_id -- User ID cannot be changed
);

-- 4. Restrict school contact information access
-- Drop the overly permissive policy for viewing schools
DROP POLICY IF EXISTS "Authenticated users can view approved schools" ON public.schools;

-- 5. Create policy that shows only basic school info (no contact details) to the public
CREATE POLICY "Public can view basic school info" 
ON public.schools 
FOR SELECT 
USING (
  is_approved = true AND 
  -- This policy will be used with a view that excludes contact info
  false -- Temporarily disable until we create the view
);

-- 6. Create a public view of schools without sensitive contact information
CREATE VIEW public.schools_public AS
SELECT 
  id,
  name,
  is_approved,
  created_at,
  updated_at
FROM public.schools
WHERE is_approved = true;

-- 7. Update the policy to work with authenticated users only for full school data
CREATE POLICY "Schools view their own full data" 
ON public.schools 
FOR SELECT 
USING (
  is_approved = true AND
  (
    -- Admins can see all school data
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Schools can see their own full data
    EXISTS (
      SELECT 1 FROM school_users 
      WHERE school_users.school_id = schools.id 
      AND school_users.user_id = auth.uid()
    )
  )
);

-- 8. Create admin-only function to update user roles (security definer)
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id uuid,
  new_role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Log the role change attempt
  RAISE NOTICE 'Admin % attempting to change user % role to %', auth.uid(), target_user_id, new_role;
  
  -- Update the user role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Verify the update happened
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;
END;
$$;