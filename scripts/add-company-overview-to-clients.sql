-- Add company_overview column to clients table
-- This will store the company overview text for each client

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS company_overview TEXT;

COMMENT ON COLUMN clients.company_overview IS 'Company overview/description for the client';
