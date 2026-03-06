-- Fix candidates table: make all nullable columns actually nullable
-- Safe to re-run — all statements use IF NOT EXISTS / IF EXISTS

-- Drop NOT NULL from commonly-missing fields
ALTER TABLE candidates ALTER COLUMN email DROP NOT NULL;
ALTER TABLE candidates ALTER COLUMN mobile_number DROP NOT NULL;

-- Add missing columns if they don't exist
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS candidate_id SERIAL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_location_array TEXT[];
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_ids TEXT[];
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS quality TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS buyout_available TEXT;

-- Make sure created_by accepts text (UUID or email)
ALTER TABLE candidates ALTER COLUMN created_by TYPE TEXT USING COALESCE(created_by::TEXT, '');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status  ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates(created_at DESC);
