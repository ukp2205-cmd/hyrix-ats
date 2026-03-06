-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_departments_industry_id ON departments(industry_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create policies for departments table
CREATE POLICY "Enable read access for all authenticated users" ON departments
  FOR SELECT
  USING (auth.role() = 'authenticated' OR is_active = true);

CREATE POLICY "Enable insert for authenticated users" ON departments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON departments
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Insert some sample departments
INSERT INTO departments (name, industry_id, description, is_active)
SELECT 
  'HR management and recruitment',
  id,
  'Human Resources and talent acquisition',
  TRUE
FROM industries WHERE name = 'Human Resources' LIMIT 1;

INSERT INTO departments (name, industry_id, description, is_active)
SELECT 
  'Information technology and systems',
  id,
  'IT infrastructure and systems management',
  TRUE
FROM industries WHERE name = 'Information Technology' LIMIT 1;

INSERT INTO departments (name, industry_id, description, is_active)
SELECT 
  'Financial planning and accounting',
  id,
  'Finance and accounting operations',
  TRUE
FROM industries WHERE name = 'Finance' LIMIT 1;

INSERT INTO departments (name, description, is_active)
VALUES 
  ('Business operations and management', 'General business operations', TRUE),
  ('Product strategy and development', 'Product management and development', TRUE),
  ('General administration and office management', 'Administrative support', TRUE);
