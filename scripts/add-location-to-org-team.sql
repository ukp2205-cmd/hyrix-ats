-- Add location column to org_team table
ALTER TABLE org_team ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comment to the column
COMMENT ON COLUMN org_team.location IS 'Team member work location';
