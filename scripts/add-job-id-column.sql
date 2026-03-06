-- Add job_id column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_id VARCHAR(20) UNIQUE;

-- Create an index on job_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id);
