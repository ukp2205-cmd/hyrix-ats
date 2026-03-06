-- Add created_by field to jobs table to track who created each job
-- This will help filter jobs by creator (recruiter or admin)

-- Add created_by column to store user email who created the job
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);

-- Add comment to describe the column
COMMENT ON COLUMN jobs.created_by IS 'Email of the user (recruiter or admin) who created this job';
