-- Temporarily disable the foreign key constraint on cities table
-- This allows you to import cities data even if states don't exist yet
-- Remember to re-enable it after importing!

-- Drop the existing foreign key constraint
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_state_id_fkey;

-- You can now import your cities data without the constraint check

-- After importing, you can optionally re-add the constraint:
-- (Uncomment the line below after importing both states and cities)
-- ALTER TABLE cities ADD CONSTRAINT cities_state_id_fkey 
--   FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE;
