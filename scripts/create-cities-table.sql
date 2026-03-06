-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- Enable Row Level Security
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cities table
-- Allow all authenticated users to read cities
CREATE POLICY "Allow authenticated users to read cities"
  ON cities
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert cities
CREATE POLICY "Allow authenticated users to insert cities"
  ON cities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update cities
CREATE POLICY "Allow authenticated users to update cities"
  ON cities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete cities
CREATE POLICY "Allow authenticated users to delete cities"
  ON cities
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE cities IS 'Stores city information linked to states';
COMMENT ON COLUMN cities.id IS 'Unique identifier for the city';
COMMENT ON COLUMN cities.name IS 'Name of the city';
COMMENT ON COLUMN cities.state_id IS 'Foreign key reference to the states table';
COMMENT ON COLUMN cities.created_at IS 'Timestamp when the city record was created';
