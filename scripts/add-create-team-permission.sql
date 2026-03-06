-- Add Create Team permission to role_permissions table
-- By default: Super Admin has full access, other roles have no access

-- Insert permissions for Create Team module
INSERT INTO role_permissions (role, module, access_level, created_at, updated_at)
VALUES 
  ('super_admin', 'Create Team', 'Full', NOW(), NOW()),
  ('hiring_manager', 'Create Team', 'No Access', NOW(), NOW()),
  ('recruiter', 'Create Team', 'No Access', NOW(), NOW())
ON CONFLICT (role, module) 
DO UPDATE SET 
  access_level = EXCLUDED.access_level,
  updated_at = NOW();
