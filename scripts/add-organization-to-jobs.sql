-- Add organization_id column to jobs table to connect jobs to specific organizations
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization(id);

-- Update existing jobs to belong to JobKarle organization
UPDATE jobs 
SET organization_id = (SELECT id FROM organization WHERE email = 'hr@jobkarle.com' LIMIT 1)
WHERE organization_id IS NULL;

-- Add organization_id column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organization(id);

-- Update existing candidates to belong to JobKarle organization
UPDATE candidates 
SET organization_id = (SELECT id FROM organization WHERE email = 'hr@jobkarle.com' LIMIT 1)
WHERE organization_id IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates(organization_id);
