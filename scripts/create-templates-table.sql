-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'email', 'job_description', 'offer_letter', etc.
  subject TEXT, -- For email templates
  content TEXT NOT NULL,
  variables JSONB, -- Placeholder variables like {candidate_name}, {job_title}
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to templates"
  ON templates FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to templates"
  ON templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to templates"
  ON templates FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to templates"
  ON templates FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_organization ON templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
