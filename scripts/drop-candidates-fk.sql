-- Drop the foreign key constraint on assigned_to and created_by so that
-- super_admin users (who have organization IDs, not org_team IDs) can
-- create candidates without triggering FK violations.
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS fk_candidates_assigned_to;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS fk_candidates_created_by;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_assigned_to_fkey;
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_created_by_fkey;

-- Make both columns plain TEXT (no FK)
ALTER TABLE candidates ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::TEXT;
ALTER TABLE candidates ALTER COLUMN created_by  TYPE TEXT USING created_by::TEXT;
