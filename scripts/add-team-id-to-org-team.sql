-- Add team_id column to org_team table to directly store team assignment
ALTER TABLE org_team
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_org_team_team_id ON org_team(team_id);

-- Migrate existing data from team_recruiters junction table to org_team
UPDATE org_team
SET team_id = (
  SELECT team_id 
  FROM team_recruiters 
  WHERE team_recruiters.recruiter_id = org_team.id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM team_recruiters 
  WHERE team_recruiters.recruiter_id = org_team.id
);
