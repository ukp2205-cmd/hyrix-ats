-- Insert 5 dummy recruiter users for JobKarle company
-- These are team members who will be assigned to jobs

INSERT INTO org_team (
  id,
  name,
  email,
  phone,
  role,
  department,
  is_admin,
  status,
  joined_date,
  created_at,
  updated_at
) VALUES
  (
    gen_random_uuid(),
    'Priya Sharma',
    'priya.sharma@jobkarle.com',
    '+91 98765 43210',
    'Senior Recruiter',
    'Talent Acquisition',
    false,
    'active',
    '2024-01-15',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Rahul Verma',
    'rahul.verma@jobkarle.com',
    '+91 98765 43211',
    'Recruiter',
    'Talent Acquisition',
    false,
    'active',
    '2024-02-20',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Anjali Patel',
    'anjali.patel@jobkarle.com',
    '+91 98765 43212',
    'Technical Recruiter',
    'Talent Acquisition',
    false,
    'active',
    '2024-03-10',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Vikram Singh',
    'vikram.singh@jobkarle.com',
    '+91 98765 43213',
    'Lead Recruiter',
    'Talent Acquisition',
    false,
    'active',
    '2023-11-05',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Sneha Reddy',
    'sneha.reddy@jobkarle.com',
    '+91 98765 43214',
    'Junior Recruiter',
    'Talent Acquisition',
    false,
    'active',
    '2024-04-01',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
