-- Create manager_pipeline table for hiring manager's candidate tracking
-- This separates hiring manager pipeline from recruiter applications table

CREATE TABLE IF NOT EXISTS public.manager_pipeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name TEXT,
  email TEXT,
  mobile_number TEXT,
  skills TEXT[],
  experience_years NUMERIC,
  current_ctc TEXT,
  expected_ctc TEXT,
  notice_period TEXT,
  current_location TEXT,
  preferred_location TEXT,
  
  -- Hiring Manager Pipeline Stages
  stage TEXT NOT NULL DEFAULT 'screening',
  stage_order INTEGER DEFAULT 0,
  
  -- Selection sub-statuses: selected, selection_rejected, selection_hold
  selection_status TEXT,
  
  -- Feedback and notes
  feedback TEXT,
  
  -- Metadata
  score NUMERIC,
  assigned_recruiter UUID REFERENCES public.org_team(id),
  hiring_manager_id UUID REFERENCES public.org_team(id),
  organization_id UUID REFERENCES public.organization(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one entry per candidate per job for hiring manager
  UNIQUE(job_id, candidate_id)
);

-- Enable RLS
ALTER TABLE public.manager_pipeline ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to manager_pipeline"
  ON public.manager_pipeline FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to manager_pipeline"
  ON public.manager_pipeline FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to manager_pipeline"
  ON public.manager_pipeline FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to manager_pipeline"
  ON public.manager_pipeline FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manager_pipeline_job_id ON public.manager_pipeline(job_id);
CREATE INDEX IF NOT EXISTS idx_manager_pipeline_candidate_id ON public.manager_pipeline(candidate_id);
CREATE INDEX IF NOT EXISTS idx_manager_pipeline_stage ON public.manager_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_manager_pipeline_hiring_manager ON public.manager_pipeline(hiring_manager_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_manager_pipeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manager_pipeline_updated_at
  BEFORE UPDATE ON public.manager_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION update_manager_pipeline_updated_at();
