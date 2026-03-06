-- Seed 15 applications for technical support job
-- Job ID: ab821e51-6b07-4153-8192-478222db1ee9

-- First, get the candidate IDs we created earlier
DO $$
DECLARE
  job_uuid UUID := 'ab821e51-6b07-4153-8192-478222db1ee9';
  candidate_ids UUID[];
  candidate_id UUID;
  stages TEXT[] := ARRAY['applied', 'screening', 'interview', 'offer', 'hired'];
  stage_index INT;
BEGIN
  -- Get all candidate IDs from the candidates table (limit to 15)
  SELECT ARRAY_AGG(id) INTO candidate_ids
  FROM (
    SELECT id FROM candidates 
    WHERE organization_id = (SELECT id FROM organization WHERE email = 'hr@jobkarle.com')
    ORDER BY created_at DESC
    LIMIT 15
  ) subquery;

  -- If we don't have enough candidates, raise an error
  IF array_length(candidate_ids, 1) < 15 THEN
    RAISE NOTICE 'Only found % candidates, need 15', array_length(candidate_ids, 1);
  END IF;

  -- Insert applications with varying stages
  stage_index := 1;
  FOREACH candidate_id IN ARRAY candidate_ids
  LOOP
    DECLARE
      current_candidate_id UUID := candidate_id;
      current_stage TEXT := stages[(stage_index - 1) % 5 + 1];
    BEGIN
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
        job_uuid,
        c.id,
        c.name,
        current_stage,
        CASE current_stage
          WHEN 'applied' THEN 1
          WHEN 'screening' THEN 2
          WHEN 'interview' THEN 3
          WHEN 'offer' THEN 4
          WHEN 'hired' THEN 5
        END,
        NOW() - (random() * interval '30 days'),
        c.years_of_experience,
        string_to_array(c.skills, ','),
        (50 + (random() * 50))::numeric
      FROM candidates c
      WHERE c.id = current_candidate_id
      ON CONFLICT (job_id, candidate_id) DO NOTHING;
    END;
    
    stage_index := stage_index + 1;
  END LOOP;

  RAISE NOTICE 'Created applications for job %', job_uuid;
END $$;

-- Verify the insertions
SELECT 
  a.stage,
  COUNT(*) as count,
  STRING_AGG(c.name, ', ') as candidate_names
FROM applications a
JOIN candidates c ON a.candidate_id = c.id
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
