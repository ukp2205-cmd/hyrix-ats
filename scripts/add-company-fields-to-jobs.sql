-- Add missing company-related columns to jobs table

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS about_company TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS work_environment TEXT;

-- Add comments for documentation
COMMENT ON COLUMN jobs.about_company IS 'Information about the hiring company';
COMMENT ON COLUMN jobs.company_size IS 'Size of the company (e.g., 1-10, 11-50, 51-200, etc.)';
COMMENT ON COLUMN jobs.company_website IS 'Company website URL';
COMMENT ON COLUMN jobs.benefits IS 'Company benefits and perks';
COMMENT ON COLUMN jobs.work_environment IS 'Description of work environment and culture';
