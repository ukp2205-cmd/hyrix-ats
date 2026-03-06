-- Add contact_name column to clients table
-- This stores JSON array of contact names corresponding to emails and phones

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contact_name TEXT;

COMMENT ON COLUMN clients.contact_name IS 'JSON array of contact person names for each email/phone pair';
