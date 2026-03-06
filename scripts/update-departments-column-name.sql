-- Update departments table to use department_name instead of name
-- This matches the CSV import format

-- First, rename the column
ALTER TABLE departments 
RENAME COLUMN name TO department_name;

-- Update the check constraint if it exists
ALTER TABLE departments 
DROP CONSTRAINT IF EXISTS departments_name_check;

-- Add comment to column
COMMENT ON COLUMN departments.department_name IS 'Name of the department';
