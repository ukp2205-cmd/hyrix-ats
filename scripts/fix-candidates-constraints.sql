-- Fix candidates table: make email nullable, add candidate_id, fix created_by type

-- 1. Make email nullable (not every candidate has email at time of creation)
ALTER TABLE candidates ALTER COLUMN email DROP NOT NULL;

-- 2. Add candidate_id as auto-incrementing human-readable ID if not exists
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS candidate_id SERIAL;

-- 3. Ensure mobile_number is also nullable (some candidates may not have phone at first entry)
ALTER TABLE candidates ALTER COLUMN mobile_number DROP NOT NULL;

-- 4. Make sure created_by and assigned_to accept UUID or TEXT (in case stored as text)
ALTER TABLE candidates ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- 5. Add preferred_location_array for multi-select preferred locations
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_location_array TEXT[];

-- 6. Confirm organization_id exists
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS organization_id UUID;
CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON candidates(organization_id);
