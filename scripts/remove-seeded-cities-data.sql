-- Remove seeded cities and states data
-- This script clears the sample data inserted by seed-cities-data.sql

-- Delete all cities
DELETE FROM cities;

-- Delete all states
DELETE FROM states;

-- Reset the tables (optional - keeps the structure)
-- TRUNCATE cities, states CASCADE;
