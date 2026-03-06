-- Add experience fields to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS min_experience INTEGER,
ADD COLUMN IF NOT EXISTS max_experience INTEGER;

-- Add comment to describe the columns
COMMENT ON COLUMN jobs.min_experience IS 'Minimum years of experience required';
COMMENT ON COLUMN jobs.max_experience IS 'Maximum years of experience required';
