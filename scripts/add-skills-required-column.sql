-- Add skills_required column to jobs table
-- This column will store comma-separated skills or JSON array of skills required for the job

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS skills_required TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN jobs.skills_required IS 'Comma-separated list of skills required for the job position';
