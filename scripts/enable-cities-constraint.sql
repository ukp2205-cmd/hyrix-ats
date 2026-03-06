-- Re-enable the foreign key constraint on cities table
-- Run this AFTER you've imported both states and cities data

-- Add back the foreign key constraint
ALTER TABLE cities ADD CONSTRAINT cities_state_id_fkey 
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE;

-- Verify the constraint was added
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'cities'::regclass;
