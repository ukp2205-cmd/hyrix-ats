-- Drop ALL foreign key constraints on candidates table (regardless of name)
-- This uses a DO block with dynamic SQL to find and drop every FK constraint

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'candidates'::regclass
      AND contype = 'f'
  )
  LOOP
    EXECUTE 'ALTER TABLE candidates DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    RAISE NOTICE 'Dropped FK constraint: %', r.conname;
  END LOOP;
END $$;

-- Also make sure the columns are TEXT (not UUID) so they can store any value
ALTER TABLE candidates ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;
ALTER TABLE candidates ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- Set them nullable
ALTER TABLE candidates ALTER COLUMN assigned_to DROP NOT NULL;
ALTER TABLE candidates ALTER COLUMN created_by DROP NOT NULL;
