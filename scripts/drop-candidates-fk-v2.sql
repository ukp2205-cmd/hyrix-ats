-- Drop all FK constraints on candidates.assigned_to and candidates.created_by
-- These columns store org_team IDs for recruiters but org IDs for super_admin,
-- so FK enforcement is inappropriate.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'candidates'::regclass
      AND contype = 'f'
      AND (
        conname ILIKE '%assigned_to%'
        OR conname ILIKE '%created_by%'
        OR conname ILIKE '%fk_candidates%'
      )
  LOOP
    EXECUTE 'ALTER TABLE candidates DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Make sure columns are plain text with no FK
ALTER TABLE candidates ALTER COLUMN assigned_to TYPE TEXT;
ALTER TABLE candidates ALTER COLUMN created_by  TYPE TEXT;
