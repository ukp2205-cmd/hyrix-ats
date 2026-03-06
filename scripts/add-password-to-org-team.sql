-- Add password column to org_team table for secure authentication
-- This allows team members to have their own login credentials

-- Add password column to store bcrypt hashed passwords
ALTER TABLE org_team
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add comment for documentation
COMMENT ON COLUMN org_team.password IS 'Bcrypt hashed password for team member authentication';
