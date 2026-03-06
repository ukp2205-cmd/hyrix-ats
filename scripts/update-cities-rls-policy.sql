-- Update RLS policies for cities table to allow public read access
-- This makes cities accessible like other reference tables (industries, skills, etc.)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read cities" ON public.cities;
DROP POLICY IF EXISTS "Allow authenticated users to insert cities" ON public.cities;
DROP POLICY IF EXISTS "Allow authenticated users to update cities" ON public.cities;
DROP POLICY IF EXISTS "Allow authenticated users to delete cities" ON public.cities;

-- Create public read access policy (like industries and skills tables)
CREATE POLICY "Allow public read access to cities"
ON public.cities
FOR SELECT
TO public
USING (true);

-- Keep insert/update/delete restricted to authenticated users
CREATE POLICY "Allow authenticated users to insert cities"
ON public.cities
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cities"
ON public.cities
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete cities"
ON public.cities
FOR DELETE
TO authenticated
USING (true);

-- Also update states table to have public read access
DROP POLICY IF EXISTS "Allow authenticated users to read states" ON public.states;
DROP POLICY IF EXISTS "Allow authenticated users to insert states" ON public.states;
DROP POLICY IF EXISTS "Allow authenticated users to update states" ON public.states;
DROP POLICY IF EXISTS "Allow authenticated users to delete states" ON public.states;

CREATE POLICY "Allow public read access to states"
ON public.states
FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow authenticated users to insert states"
ON public.states
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update states"
ON public.states
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete states"
ON public.states
FOR DELETE
TO authenticated
USING (true);
