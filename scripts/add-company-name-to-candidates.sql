-- Add company_name column to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS company_name character varying;
