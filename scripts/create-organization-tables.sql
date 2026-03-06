-- Create organization table
CREATE TABLE IF NOT EXISTS public.organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  admin_role TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create org_team table
CREATE TABLE IF NOT EXISTS public.org_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_org_team_organization_id ON public.org_team(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_team_role ON public.org_team(role);
CREATE INDEX IF NOT EXISTS idx_organization_email ON public.organization(email);

-- Enable RLS
ALTER TABLE public.organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_team ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization
CREATE POLICY "Allow public read access to organization" ON public.organization FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to organization" ON public.organization FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to organization" ON public.organization FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to organization" ON public.organization FOR DELETE USING (true);

-- RLS Policies for org_team
CREATE POLICY "Allow public read access to org_team" ON public.org_team FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to org_team" ON public.org_team FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to org_team" ON public.org_team FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to org_team" ON public.org_team FOR DELETE USING (true);

-- Insert dummy data for organization
INSERT INTO public.organization (name, email, phone, address, city, state, country, website, industry, company_size, admin_name, admin_email, admin_role, status) VALUES
('Tech Solutions Pvt Ltd', 'info@techsolutions.com', '+91-9876543210', '123 Tech Park, Electronic City', 'Bangalore', 'Karnataka', 'India', 'www.techsolutions.com', 'Information Technology', '500-1000', 'Rajesh Kumar', 'rajesh@techsolutions.com', 'CEO', 'active'),
('Digital Marketing Hub', 'contact@digitalmarketinghub.com', '+91-9876543211', '456 Business Tower, MG Road', 'Mumbai', 'Maharashtra', 'India', 'www.digitalmarketinghub.com', 'Marketing', '100-500', 'Priya Sharma', 'priya@digitalmarketinghub.com', 'Founder', 'active'),
('FinTech Innovators', 'hello@fintechinnovators.com', '+91-9876543212', '789 Finance Street, Bandra', 'Mumbai', 'Maharashtra', 'India', 'www.fintechinnovators.com', 'Financial Services', '50-100', 'Amit Patel', 'amit@fintechinnovators.com', 'Managing Director', 'active'),
('Healthcare Solutions Inc', 'info@healthcaresolutions.com', '+91-9876543213', '321 Medical Complex, Koramangala', 'Bangalore', 'Karnataka', 'India', 'www.healthcaresolutions.com', 'Healthcare', '200-500', 'Dr. Sneha Reddy', 'sneha@healthcaresolutions.com', 'CEO', 'active'),
('EduTech Learning', 'support@edutechlearning.com', '+91-9876543214', '654 Knowledge Park, Whitefield', 'Bangalore', 'Karnataka', 'India', 'www.edutechlearning.com', 'Education', '100-200', 'Karthik Menon', 'karthik@edutechlearning.com', 'Founder & CEO', 'active');

-- Insert dummy data for org_team
INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Rajesh Kumar',
  'rajesh@techsolutions.com',
  'CEO',
  'Management',
  '+91-9876543210',
  'active'
FROM public.organization o WHERE o.name = 'Tech Solutions Pvt Ltd';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Anita Desai',
  'anita@techsolutions.com',
  'HR Manager',
  'Human Resources',
  '+91-9876543215',
  'active'
FROM public.organization o WHERE o.name = 'Tech Solutions Pvt Ltd';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Vikram Singh',
  'vikram@techsolutions.com',
  'Recruitment Lead',
  'Human Resources',
  '+91-9876543216',
  'active'
FROM public.organization o WHERE o.name = 'Tech Solutions Pvt Ltd';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Priya Sharma',
  'priya@digitalmarketinghub.com',
  'Founder',
  'Management',
  '+91-9876543211',
  'active'
FROM public.organization o WHERE o.name = 'Digital Marketing Hub';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Rohan Mehta',
  'rohan@digitalmarketinghub.com',
  'Talent Acquisition Manager',
  'Human Resources',
  '+91-9876543217',
  'active'
FROM public.organization o WHERE o.name = 'Digital Marketing Hub';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Amit Patel',
  'amit@fintechinnovators.com',
  'Managing Director',
  'Management',
  '+91-9876543212',
  'active'
FROM public.organization o WHERE o.name = 'FinTech Innovators';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Sneha Iyer',
  'sneha.iyer@fintechinnovators.com',
  'Senior Recruiter',
  'Human Resources',
  '+91-9876543218',
  'active'
FROM public.organization o WHERE o.name = 'FinTech Innovators';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Dr. Sneha Reddy',
  'sneha@healthcaresolutions.com',
  'CEO',
  'Management',
  '+91-9876543213',
  'active'
FROM public.organization o WHERE o.name = 'Healthcare Solutions Inc';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Ramesh Krishnan',
  'ramesh@healthcaresolutions.com',
  'HR Head',
  'Human Resources',
  '+91-9876543219',
  'active'
FROM public.organization o WHERE o.name = 'Healthcare Solutions Inc';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Karthik Menon',
  'karthik@edutechlearning.com',
  'Founder & CEO',
  'Management',
  '+91-9876543214',
  'active'
FROM public.organization o WHERE o.name = 'EduTech Learning';

INSERT INTO public.org_team (organization_id, name, email, role, department, phone, status) 
SELECT 
  o.id,
  'Meera Nair',
  'meera@edutechlearning.com',
  'Recruitment Specialist',
  'Human Resources',
  '+91-9876543220',
  'active'
FROM public.organization o WHERE o.name = 'EduTech Learning';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organization_updated_at BEFORE UPDATE ON public.organization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_team_updated_at BEFORE UPDATE ON public.org_team FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
