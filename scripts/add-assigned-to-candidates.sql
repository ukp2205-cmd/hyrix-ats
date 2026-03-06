-- Add assigned_to column to candidates table
-- This will store the UUID of the team member assigned to the candidate

ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Add a comment to document the column
COMMENT ON COLUMN candidates.assigned_to IS 'UUID of the team member (from org_team) assigned to this candidate';

-- Optionally, add a foreign key constraint to org_team
ALTER TABLE candidates 
ADD CONSTRAINT fk_candidates_assigned_to 
FOREIGN KEY (assigned_to) 
REFERENCES org_team(id) 
ON DELETE SET NULL;
