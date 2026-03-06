-- Fix infinite recursion in user_roles RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow public insert access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow public update access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow public delete access to user_roles" ON user_roles;

-- Create simpler policies without recursion
CREATE POLICY "Allow all operations on user_roles"
ON user_roles
FOR ALL
USING (true)
WITH CHECK (true);

-- Also ensure org_team has proper policies
DROP POLICY IF EXISTS "Allow public read access to org_team" ON org_team;
DROP POLICY IF EXISTS "Allow public insert access to org_team" ON org_team;
DROP POLICY IF EXISTS "Allow public update access to org_team" ON org_team;
DROP POLICY IF EXISTS "Allow public delete access to org_team" ON org_team;

CREATE POLICY "Allow all operations on org_team"
ON org_team
FOR ALL
USING (true)
WITH CHECK (true);
