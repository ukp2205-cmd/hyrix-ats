-- Add status column to clients table if it does not exist
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Update any existing rows that may have NULL status
UPDATE clients SET status = 'active' WHERE status IS NULL;

-- Add index for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
