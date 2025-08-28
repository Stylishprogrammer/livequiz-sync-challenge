-- Remove the public access policy that exposes sensitive school contact information
DROP POLICY IF EXISTS "Anyone can view approved schools" ON public.schools;

-- Add a more restrictive policy that only allows authenticated users to view schools
-- This ensures only logged-in users (admins and school users) can access school data
CREATE POLICY "Authenticated users can view approved schools" 
ON public.schools 
FOR SELECT 
TO authenticated
USING (is_approved = true);

-- Optional: If you need public access to basic school info (without sensitive contact data),
-- you could create a view with only non-sensitive fields:
-- CREATE VIEW public.schools_public AS 
-- SELECT id, name, address, created_at 
-- FROM public.schools 
-- WHERE is_approved = true;

-- For now, we'll keep it simple and require authentication to view any school data