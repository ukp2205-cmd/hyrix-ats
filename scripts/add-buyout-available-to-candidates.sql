-- Add buyout_available column to candidates table
-- This field tracks whether the candidate is available for notice period buyout

-- Add the buyout_available column
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS buyout_available character varying;

-- Add a comment to describe the column
COMMENT ON COLUMN candidates.buyout_available IS 'Indicates whether candidate is available for notice period buyout (Yes/No)';
