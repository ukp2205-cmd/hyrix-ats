-- Add created_by to candidates table (tracks which org_team member created the candidate)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add job_ids array column to candidates table for multi-job assignment
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_ids UUID[] DEFAULT '{}';

-- Add designation column if missing
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS designation VARCHAR(255);

-- Add area column if missing  
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS area VARCHAR(255);

-- Add source column if missing
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS source VARCHAR(100);

-- Add quality column if missing
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS quality VARCHAR(50);

-- Add buyout_available column if missing
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS buyout_available VARCHAR(50);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON candidates(created_by);
CREATE INDEX IF NOT EXISTS idx_candidates_assigned_to ON candidates(assigned_to);
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates(organization_id);
