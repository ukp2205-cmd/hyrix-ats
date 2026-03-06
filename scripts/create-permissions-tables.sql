-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access to roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Allow public read access to permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to role_permissions" ON public.role_permissions FOR SELECT USING (true);

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
  ('super_admin', 'Super Administrator with full system access'),
  ('hiring_manager', 'Hiring Manager with limited access to own jobs'),
  ('recruiter', 'Recruiter with access to assigned jobs')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions
INSERT INTO public.permissions (key, description, module) VALUES
  ('dashboard.view.all', 'View full dashboard with all data', 'dashboard'),
  ('dashboard.view.own', 'View dashboard with own data only', 'dashboard'),
  ('dashboard.view.assigned', 'View dashboard with assigned data only', 'dashboard'),
  
  ('clients.create', 'Create new clients', 'clients'),
  ('clients.edit', 'Edit existing clients', 'clients'),
  ('clients.delete', 'Delete clients', 'clients'),
  ('clients.view', 'View clients', 'clients'),
  
  ('users.create', 'Create new users', 'users'),
  ('users.edit', 'Edit existing users', 'users'),
  ('users.delete', 'Delete users', 'users'),
  ('users.view', 'View users', 'users'),
  
  ('settings.role_permissions', 'Manage role and permission settings', 'settings'),
  ('settings.company', 'Manage company settings', 'settings'),
  
  ('jobs.create', 'Create new job postings', 'jobs'),
  ('jobs.edit.all', 'Edit any job posting', 'jobs'),
  ('jobs.edit.own', 'Edit only own job postings', 'jobs'),
  ('jobs.edit.assigned', 'Edit only assigned job postings', 'jobs'),
  ('jobs.delete', 'Delete job postings', 'jobs'),
  ('jobs.view.all', 'View all job postings', 'jobs'),
  ('jobs.view.own', 'View only own job postings', 'jobs'),
  ('jobs.view.assigned', 'View only assigned job postings', 'jobs'),
  
  ('candidates.view.all', 'View all candidates', 'candidates'),
  ('candidates.view.own', 'View candidates for own jobs', 'candidates'),
  ('candidates.view.assigned', 'View candidates for assigned jobs', 'candidates'),
  ('candidates.add.all', 'Add candidates to any job', 'candidates'),
  ('candidates.add.own', 'Add candidates to own jobs', 'candidates'),
  ('candidates.add.assigned', 'Add candidates to assigned jobs', 'candidates'),
  ('candidates.move_stage', 'Move candidates between stages', 'candidates'),
  
  ('interviews.schedule.all', 'Schedule interviews for all jobs', 'interviews'),
  ('interviews.schedule.own', 'Schedule interviews for own jobs', 'interviews'),
  ('interviews.schedule.assigned', 'Schedule interviews for assigned jobs', 'interviews'),
  
  ('reports.view', 'View reports and analytics', 'reports'),
  ('billing.view', 'View billing and subscription information', 'billing'),
  ('billing.manage', 'Manage billing and subscriptions', 'billing'),
  ('activity_logs.view', 'View activity logs', 'activity_logs')
ON CONFLICT (key) DO NOTHING;

-- Assign permissions to Super Admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Hiring Manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'hiring_manager'
  AND p.key IN (
    'dashboard.view.own',
    'jobs.create',
    'jobs.edit.own',
    'jobs.view.own',
    'candidates.view.own',
    'candidates.add.own',
    'interviews.schedule.own'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Recruiter
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'recruiter'
  AND p.key IN (
    'dashboard.view.assigned',
    'jobs.create',
    'jobs.edit.assigned',
    'jobs.view.assigned',
    'candidates.view.assigned',
    'candidates.add.assigned',
    'candidates.move_stage',
    'interviews.schedule.assigned'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;
