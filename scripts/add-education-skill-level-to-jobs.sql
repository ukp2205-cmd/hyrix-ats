-- Add education and skill_level columns to jobs table

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS skill_level text;

-- Add comment for documentation
COMMENT ON COLUMN jobs.education IS 'Education level required for the job (e.g., high-school, bachelor, master, phd)';
COMMENT ON COLUMN jobs.skill_level IS 'Skill level required for the job (e.g., entry, intermediate, senior, expert)';
