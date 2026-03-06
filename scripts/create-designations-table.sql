-- Create designations table for storing candidate designations with autosuggest
CREATE TABLE IF NOT EXISTS public.designations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  organization_id UUID REFERENCES public.organization(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint per organization (allow same name across orgs, unique within one org)
CREATE UNIQUE INDEX IF NOT EXISTS designations_name_org_idx 
  ON public.designations (LOWER(name), organization_id);

-- Global designations (organization_id IS NULL) also unique by name
CREATE UNIQUE INDEX IF NOT EXISTS designations_name_global_idx
  ON public.designations (LOWER(name))
  WHERE organization_id IS NULL;

-- RLS
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to designations" ON public.designations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to designations" ON public.designations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to designations" ON public.designations
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to designations" ON public.designations
  FOR DELETE USING (true);

-- Seed common designations (global, no organization_id)
INSERT INTO public.designations (name, organization_id) VALUES
  ('Software Engineer', NULL),
  ('Senior Software Engineer', NULL),
  ('Lead Engineer', NULL),
  ('Principal Engineer', NULL),
  ('Engineering Manager', NULL),
  ('VP Engineering', NULL),
  ('CTO', NULL),
  ('Product Manager', NULL),
  ('Senior Product Manager', NULL),
  ('Director of Product', NULL),
  ('VP Product', NULL),
  ('CPO', NULL),
  ('Data Analyst', NULL),
  ('Senior Data Analyst', NULL),
  ('Data Scientist', NULL),
  ('Senior Data Scientist', NULL),
  ('ML Engineer', NULL),
  ('DevOps Engineer', NULL),
  ('Senior DevOps Engineer', NULL),
  ('SRE', NULL),
  ('Cloud Architect', NULL),
  ('UI/UX Designer', NULL),
  ('Senior Designer', NULL),
  ('Design Lead', NULL),
  ('Creative Director', NULL),
  ('Business Analyst', NULL),
  ('Senior Business Analyst', NULL),
  ('Project Manager', NULL),
  ('Scrum Master', NULL),
  ('Sales Executive', NULL),
  ('Senior Sales Executive', NULL),
  ('Sales Manager', NULL),
  ('VP Sales', NULL),
  ('Marketing Executive', NULL),
  ('Digital Marketing Manager', NULL),
  ('Content Manager', NULL),
  ('Growth Manager', NULL),
  ('HR Executive', NULL),
  ('HR Manager', NULL),
  ('Talent Acquisition Specialist', NULL),
  ('HRBP', NULL),
  ('Finance Analyst', NULL),
  ('Senior Finance Analyst', NULL),
  ('Finance Manager', NULL),
  ('CFO', NULL),
  ('Operations Executive', NULL),
  ('Operations Manager', NULL),
  ('VP Operations', NULL),
  ('COO', NULL),
  ('Customer Success Manager', NULL),
  ('Account Manager', NULL),
  ('Key Account Manager', NULL),
  ('QA Engineer', NULL),
  ('Senior QA Engineer', NULL),
  ('QA Lead', NULL),
  ('Test Architect', NULL),
  ('Full Stack Developer', NULL),
  ('Frontend Developer', NULL),
  ('Backend Developer', NULL),
  ('Mobile Developer', NULL),
  ('Android Developer', NULL),
  ('iOS Developer', NULL),
  ('React Developer', NULL),
  ('Node.js Developer', NULL)
ON CONFLICT DO NOTHING;
