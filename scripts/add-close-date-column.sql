-- Add close_date column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS close_date timestamp with time zone;

-- Add a comment to the column
COMMENT ON COLUMN jobs.close_date IS 'Date when the job posting closes (typically 30 days from created_at)';
