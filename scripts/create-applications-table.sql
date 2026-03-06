-- Create applications table for ATS Kanban pipeline
-- This table tracks job applications and supports drag-and-drop between stages

CREATE TABLE IF NOT EXISTS applications (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign keys
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  
  -- Candidate information (denormalized for quick display)
  candidate_name TEXT NOT NULL,
  skills TEXT[],
  experience_years NUMERIC(3,1),
  
  -- Application scoring
  score NUMERIC(3,1) CHECK (score >= 0 AND score <= 10),
  
  -- Stage tracking
  stage TEXT NOT NULL CHECK (stage IN ('applied', 'screening', 'interview', 'offer', 'hired')),
  stage_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one application per candidate per job
  UNIQUE(job_id, candidate_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(stage);
CREATE INDEX IF NOT EXISTS idx_applications_stage_order ON applications(stage_order);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete applications"
  ON applications
  FOR DELETE
  TO authenticated
  USING (true);

-- Comment on table and columns for documentation
COMMENT ON TABLE applications IS 'Tracks job applications through recruitment pipeline stages';
COMMENT ON COLUMN applications.stage IS 'Current stage: applied, screening, interview, offer, hired';
COMMENT ON COLUMN applications.stage_order IS 'Order of card within stage for drag-and-drop positioning';
COMMENT ON COLUMN applications.score IS 'Application score from 0-10 for ranking candidates';
