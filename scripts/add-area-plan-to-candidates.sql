-- Add area_plan column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS area_plan character varying;

-- Add comment to describe the column
COMMENT ON COLUMN candidates.area_plan IS 'Area plan or territory assignment for the candidate';
