-- Enable RLS on applications table if not already enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to applications" ON applications;
DROP POLICY IF EXISTS "Allow public insert access to applications" ON applications;
DROP POLICY IF EXISTS "Allow public update access to applications" ON applications;
DROP POLICY IF EXISTS "Allow public delete access to applications" ON applications;

-- Create policies for full public access (for development)
-- You should adjust these in production based on your authentication system

-- Allow anyone to read applications
CREATE POLICY "Allow public read access to applications"
ON applications
FOR SELECT
TO public
USING (true);

-- Allow anyone to insert applications
CREATE POLICY "Allow public insert access to applications"
ON applications
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to update applications
CREATE POLICY "Allow public update access to applications"
ON applications
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow anyone to delete applications
CREATE POLICY "Allow public delete access to applications"
ON applications
FOR DELETE
TO public
USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'applications';
