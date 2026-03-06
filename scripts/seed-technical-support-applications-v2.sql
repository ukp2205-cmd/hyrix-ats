-- Seed 15 applications for technical support job
-- Job ID: ab821e51-6b07-4153-8192-478222db1ee9

WITH candidate_list AS (
  SELECT 
    id,
    name,
    years_of_experience,
    skills,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM candidates 
  WHERE organization_id = (SELECT id FROM organization WHERE email = 'hr@jobkarle.com')
  LIMIT 15
),
staged_candidates AS (
  SELECT 
    id,
    name,
    years_of_experience,
    skills,
    CASE 
      WHEN (rn - 1) % 5 = 0 THEN 'applied'
      WHEN (rn - 1) % 5 = 1 THEN 'screening'
      WHEN (rn - 1) % 5 = 2 THEN 'interview'
      WHEN (rn - 1) % 5 = 3 THEN 'offer'
      ELSE 'hired'
    END as stage,
    CASE 
      WHEN (rn - 1) % 5 = 0 THEN 1
      WHEN (rn - 1) % 5 = 1 THEN 2
      WHEN (rn - 1) % 5 = 2 THEN 3
      WHEN (rn - 1) % 5 = 3 THEN 4
      ELSE 5
    END as stage_order,
    rn
  FROM candidate_list
)
INSERT INTO applications (
  job_id,
  candidate_id,
  candidate_name,
  stage,
  stage_order,
  applied_at,
  experience_years,
  skills,
  score
)
SELECT 
  'ab821e51-6b07-4153-8192-478222db1ee9'::uuid,
  id,
  name,
  stage,
  stage_order,
  NOW() - (random() * interval '30 days'),
  years_of_experience,
  string_to_array(skills, ','),
  (6 + (random() * 4))::numeric(3,1) -- Random score between 6.0-10.0
FROM staged_candidates
ON CONFLICT (job_id, candidate_id) DO NOTHING;

-- Verify the insertions
SELECT 
  a.stage,
  COUNT(*) as count,
  STRING_AGG(a.candidate_name, ', ') as candidates
FROM applications a
WHERE a.job_id = 'ab821e51-6b07-4153-8192-478222db1ee9'
GROUP BY a.stage
ORDER BY 
  CASE a.stage
    WHEN 'applied' THEN 1
    WHEN 'screening' THEN 2
    WHEN 'interview' THEN 3
    WHEN 'offer' THEN 4
    WHEN 'hired' THEN 5
  END;
