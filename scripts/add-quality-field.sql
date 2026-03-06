-- Add quality field to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS quality VARCHAR(10);

-- Add comment to describe the column
COMMENT ON COLUMN candidates.quality IS 'Candidate quality rating: A1, B1, B2, C1, C2, C3';
