-- Add missing columns to jobs table that are in the form but not in database

-- Add responsibilities field (job responsibilities)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT;

-- Add company_info field (additional company information)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_info TEXT;

-- Add application_process field (how to apply instructions)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_process TEXT;

-- Add keywords field (SEO/search keywords)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS keywords TEXT;

-- Add job_opening_status field (in-progress, on-hold, etc.)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_opening_status TEXT DEFAULT 'in-progress';

COMMENT ON COLUMN jobs.responsibilities IS 'Job responsibilities and duties';
COMMENT ON COLUMN jobs.company_info IS 'Additional company information';
COMMENT ON COLUMN jobs.application_process IS 'Application process instructions';
COMMENT ON COLUMN jobs.keywords IS 'SEO and search keywords';
COMMENT ON COLUMN jobs.job_opening_status IS 'Status of job opening (in-progress, on-hold, closed)';
