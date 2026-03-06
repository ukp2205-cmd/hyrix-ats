-- Create states table first (required for cities foreign key)
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT DEFAULT 'India',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_states_name ON states(name);

-- Enable Row Level Security
ALTER TABLE states ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for states table
-- Allow all authenticated users to read states
CREATE POLICY "Allow authenticated users to read states"
  ON states
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert states
CREATE POLICY "Allow authenticated users to insert states"
  ON states
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update states
CREATE POLICY "Allow authenticated users to update states"
  ON states
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete states
CREATE POLICY "Allow authenticated users to delete states"
  ON states
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE states IS 'Stores state/province information';
COMMENT ON COLUMN states.id IS 'Unique identifier for the state';
COMMENT ON COLUMN states.name IS 'Name of the state';
COMMENT ON COLUMN states.country IS 'Country the state belongs to';
COMMENT ON COLUMN states.created_at IS 'Timestamp when the state record was created';
