-- Add RLS policies for Job-Karle-ATS
-- This allows public access for now, can be restricted later based on auth requirements

-- Enable RLS on jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Jobs policies - Allow all operations for now (can be restricted to authenticated users later)
CREATE POLICY "Allow public read access to jobs" ON jobs
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to jobs" ON jobs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to jobs" ON jobs
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to jobs" ON jobs
  FOR DELETE
  USING (true);

-- Enable RLS on candidates table
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Candidates policies - Allow all operations for now
CREATE POLICY "Allow public read access to candidates" ON candidates
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to candidates" ON candidates
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to candidates" ON candidates
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to candidates" ON candidates
  FOR DELETE
  USING (true);
