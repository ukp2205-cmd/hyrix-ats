-- Add GST column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gst text;

-- Add comment to describe the column
COMMENT ON COLUMN clients.gst IS 'GST number for the client company';
