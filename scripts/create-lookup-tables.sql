-- Create all lookup tables needed by the candidates form and list

-- Designations table
CREATE TABLE IF NOT EXISTS designations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Industries table  
CREATE TABLE IF NOT EXISTS industries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  skill_name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed some common designations if table is empty
INSERT INTO designations (name) 
SELECT name FROM (VALUES
  ('Software Engineer'),
  ('Senior Software Engineer'),
  ('Tech Lead'),
  ('Engineering Manager'),
  ('Product Manager'),
  ('Data Analyst'),
  ('Data Scientist'),
  ('DevOps Engineer'),
  ('QA Engineer'),
  ('UI/UX Designer'),
  ('Business Analyst'),
  ('Project Manager'),
  ('HR Executive'),
  ('Sales Executive'),
  ('Marketing Executive'),
  ('Customer Support'),
  ('Operations Manager'),
  ('Finance Manager'),
  ('Accountant'),
  ('Content Writer')
) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM designations LIMIT 1)
ON CONFLICT (name) DO NOTHING;

-- Seed some common industries if table is empty
INSERT INTO industries (name)
SELECT name FROM (VALUES
  ('Information Technology'),
  ('Software'),
  ('Banking & Finance'),
  ('Healthcare'),
  ('Education'),
  ('E-commerce'),
  ('Manufacturing'),
  ('Retail'),
  ('Telecommunications'),
  ('Media & Entertainment'),
  ('Real Estate'),
  ('Hospitality'),
  ('Automotive'),
  ('Consulting'),
  ('Insurance')
) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM industries LIMIT 1)
ON CONFLICT (name) DO NOTHING;

-- Seed major Indian cities if table is empty
INSERT INTO cities (name, state, country)
SELECT * FROM (VALUES
  ('Mumbai', 'Maharashtra', 'India'),
  ('Delhi', 'Delhi', 'India'),
  ('Bangalore', 'Karnataka', 'India'),
  ('Bengaluru', 'Karnataka', 'India'),
  ('Hyderabad', 'Telangana', 'India'),
  ('Chennai', 'Tamil Nadu', 'India'),
  ('Kolkata', 'West Bengal', 'India'),
  ('Pune', 'Maharashtra', 'India'),
  ('Ahmedabad', 'Gujarat', 'India'),
  ('Jaipur', 'Rajasthan', 'India'),
  ('Lucknow', 'Uttar Pradesh', 'India'),
  ('Noida', 'Uttar Pradesh', 'India'),
  ('Gurgaon', 'Haryana', 'India'),
  ('Gurugram', 'Haryana', 'India'),
  ('Chandigarh', 'Chandigarh', 'India'),
  ('Indore', 'Madhya Pradesh', 'India'),
  ('Bhopal', 'Madhya Pradesh', 'India'),
  ('Coimbatore', 'Tamil Nadu', 'India'),
  ('Kochi', 'Kerala', 'India'),
  ('Thiruvananthapuram', 'Kerala', 'India')
) AS t(name, state, country)
WHERE NOT EXISTS (SELECT 1 FROM cities LIMIT 1);

-- Seed common skills if table is empty
INSERT INTO skills (skill_name, category)
SELECT skill_name, category FROM (VALUES
  ('JavaScript', 'Programming'),
  ('Python', 'Programming'),
  ('Java', 'Programming'),
  ('React', 'Frontend'),
  ('Angular', 'Frontend'),
  ('Node.js', 'Backend'),
  ('SQL', 'Database'),
  ('AWS', 'Cloud'),
  ('Docker', 'DevOps'),
  ('Git', 'Tools'),
  ('Communication', 'Soft Skills'),
  ('Leadership', 'Soft Skills'),
  ('Problem Solving', 'Soft Skills'),
  ('Excel', 'Tools'),
  ('Customer Service', 'Soft Skills')
) AS t(skill_name, category)
WHERE NOT EXISTS (SELECT 1 FROM skills LIMIT 1)
ON CONFLICT (skill_name) DO NOTHING;
