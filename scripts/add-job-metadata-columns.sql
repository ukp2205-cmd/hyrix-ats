-- Add new columns to jobs table for client and recruiter information
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS account_manager VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_recruiter VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS industry VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
