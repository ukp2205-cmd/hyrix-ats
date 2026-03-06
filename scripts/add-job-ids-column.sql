-- Add job_ids array column to candidates table for multi-job assignment
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_ids uuid[] DEFAULT '{}';

-- Migrate existing job_id into job_ids array (if job_id is set)
UPDATE candidates
SET job_ids = ARRAY[job_id]
WHERE job_id IS NOT NULL AND (job_ids IS NULL OR job_ids = '{}');
