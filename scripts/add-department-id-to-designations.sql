-- Add department_id FK to designations table, linking it to departments
ALTER TABLE designations
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

-- Index for fast lookup by department
CREATE INDEX IF NOT EXISTS idx_designations_department_id ON designations(department_id);

-- Update RLS: existing policies already cover public read/insert/update/delete, no changes needed
