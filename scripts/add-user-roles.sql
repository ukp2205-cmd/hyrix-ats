-- Add user_id and is_admin fields to org_team table
ALTER TABLE org_team ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE org_team ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add user_id to organization table to track who created the organization
ALTER TABLE organization ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE organization ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth.users(id);

-- Update existing organizations to set admin flag
UPDATE org_team SET is_admin = true WHERE role = 'CEO' OR role = 'Founder';

-- Create a user_roles table for more flexible role management
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'recruiter', 'team_member', 'viewer')),
  organization_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Allow users to read their own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow super admins to manage all roles" ON user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_team_user_id ON org_team(user_id);

-- Insert sample super admin (you'll need to replace with actual user ID after signup)
-- This is a placeholder comment - actual user_id should be inserted after user signs up
-- INSERT INTO user_roles (user_id, role, organization_id) VALUES ('your-user-id-here', 'super_admin', NULL);

COMMENT ON TABLE user_roles IS 'Stores user roles and permissions for RBAC';
COMMENT ON COLUMN user_roles.role IS 'super_admin: Full access, admin: Org admin, recruiter: Can manage candidates/jobs, team_member: Can view and edit assigned items, viewer: Read-only access';
