-- Disable RLS on user_roles table to prevent infinite recursion
-- This table needs to be accessible without complex role checks

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow super admins to manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Allow users to read their own roles" ON user_roles;

-- Disable RLS entirely on user_roles table
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Make org_team fully accessible as well
ALTER TABLE org_team DISABLE ROW LEVEL SECURITY;
