-- Rename area_plan column to area in candidates table
ALTER TABLE candidates 
RENAME COLUMN area_plan TO area;
