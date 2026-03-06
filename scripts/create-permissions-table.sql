-- Create role_permissions table to store configurable permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  module VARCHAR(100) NOT NULL,
  access_level VARCHAR(50) NOT NULL, -- 'Full', 'Limited', 'Own Jobs', 'Assigned Jobs', 'No Access', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, module)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- Insert default permissions for all roles
INSERT INTO role_permissions (role, module, access_level) VALUES
  -- Super Admin (Full access to everything)
  ('super_admin', 'Dashboard', 'Full'),
  ('super_admin', 'Manage Clients', 'Create / Edit / Delete'),
  ('super_admin', 'Manage Users', 'Full'),
  ('super_admin', 'Role & Permission Settings', 'Full'),
  ('super_admin', 'Company Settings', 'Full'),
  ('super_admin', 'Create Job', 'Yes'),
  ('super_admin', 'Edit Job', 'Yes'),
  ('super_admin', 'Delete Job', 'Yes'),
  ('super_admin', 'View All Jobs', 'Yes'),
  ('super_admin', 'View All Candidates', 'Yes'),
  ('super_admin', 'Add Candidate', 'Yes'),
  ('super_admin', 'Move Candidate Stage', 'Yes'),
  ('super_admin', 'Schedule Interview', 'Yes'),
  ('super_admin', 'Offer Management', 'Yes'),
  ('super_admin', 'Reports & Analytics', 'Full'),
  ('super_admin', 'Billing / Subscription', 'Yes'),
  ('super_admin', 'Activity Logs', 'Full'),
  
  -- Admin
  ('admin', 'Dashboard', 'Full'),
  ('admin', 'Manage Clients', 'Create / Edit / Delete'),
  ('admin', 'Manage Users', 'Full'),
  ('admin', 'Role & Permission Settings', 'Full'),
  ('admin', 'Company Settings', 'Full'),
  ('admin', 'Create Job', 'Yes'),
  ('admin', 'Edit Job', 'Yes'),
  ('admin', 'Delete Job', 'No'),
  ('admin', 'View All Jobs', 'Yes'),
  ('admin', 'View All Candidates', 'Yes'),
  ('admin', 'Add Candidate', 'Yes'),
  ('admin', 'Move Candidate Stage', 'Yes'),
  ('admin', 'Schedule Interview', 'Yes'),
  ('admin', 'Offer Management', 'Yes'),
  ('admin', 'Reports & Analytics', 'Full'),
  ('admin', 'Billing / Subscription', 'Yes'),
  ('admin', 'Activity Logs', 'Full'),
  
  -- Hiring Manager
  ('hiring_manager', 'Dashboard', 'Limited'),
  ('hiring_manager', 'Manage Clients', 'No Access'),
  ('hiring_manager', 'Manage Users', 'No Access'),
  ('hiring_manager', 'Role & Permission Settings', 'No Access'),
  ('hiring_manager', 'Company Settings', 'No Access'),
  ('hiring_manager', 'Create Job', 'Yes'),
  ('hiring_manager', 'Edit Job', 'Own Jobs'),
  ('hiring_manager', 'Delete Job', 'No'),
  ('hiring_manager', 'View All Jobs', 'Own Jobs'),
  ('hiring_manager', 'View All Candidates', 'Own Jobs'),
  ('hiring_manager', 'Add Candidate', 'Own Jobs'),
  ('hiring_manager', 'Move Candidate Stage', 'Yes'),
  ('hiring_manager', 'Schedule Interview', 'Own Jobs'),
  ('hiring_manager', 'Offer Management', 'Yes'),
  ('hiring_manager', 'Reports & Analytics', 'Limited'),
  ('hiring_manager', 'Billing / Subscription', 'No'),
  ('hiring_manager', 'Activity Logs', 'No'),
  
  -- Recruiter
  ('recruiter', 'Dashboard', 'Limited'),
  ('recruiter', 'Manage Clients', 'No Access'),
  ('recruiter', 'Manage Users', 'No Access'),
  ('recruiter', 'Role & Permission Settings', 'No Access'),
  ('recruiter', 'Company Settings', 'No Access'),
  ('recruiter', 'Create Job', 'Yes'),
  ('recruiter', 'Edit Job', 'Assigned Jobs'),
  ('recruiter', 'Delete Job', 'No'),
  ('recruiter', 'View All Jobs', 'Assigned Only'),
  ('recruiter', 'View All Candidates', 'Assigned Jobs'),
  ('recruiter', 'Add Candidate', 'Assigned Jobs'),
  ('recruiter', 'Move Candidate Stage', 'No'),
  ('recruiter', 'Schedule Interview', 'Assigned Jobs'),
  ('recruiter', 'Offer Management', 'No'),
  ('recruiter', 'Reports & Analytics', 'No'),
  ('recruiter', 'Billing / Subscription', 'No'),
  ('recruiter', 'Activity Logs', 'No')
ON CONFLICT (role, module) DO NOTHING;
