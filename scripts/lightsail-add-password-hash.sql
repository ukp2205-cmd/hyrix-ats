-- Run this ONCE on your Lightsail PostgreSQL database after importing the Supabase dump
-- Adds password_hash to organization table if it doesn't exist yet

ALTER TABLE organization
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add password column to org_team if it doesn't already exist
ALTER TABLE org_team
  ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_organization_email_lower ON organization (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_org_team_email_lower     ON org_team     (LOWER(email));

-- After running this script, you MUST set passwords for all users.
-- Example: UPDATE organization SET password_hash = '$2b$10$...' WHERE email = 'admin@example.com';
-- Use bcrypt to generate the hash: https://bcrypt.online/
