-- Create skills table for storing skills with categories
-- This table will be used to import skills via CSV and provide skill suggestions

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  skill_name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on skill_name for faster searches
CREATE INDEX IF NOT EXISTS idx_skills_skill_name ON skills(skill_name);

-- Create index on category for filtering by category
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Add unique constraint to prevent duplicate skill names
ALTER TABLE skills ADD CONSTRAINT unique_skill_name UNIQUE (skill_name);

-- Enable Row Level Security (optional, for future use)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all users to read skills
CREATE POLICY "Allow public read access to skills" ON skills
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT ON skills TO anon, authenticated;
GRANT ALL ON skills TO service_role;
