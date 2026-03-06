-- Migrate existing hiring manager data from applications to manager_pipeline
-- This script copies candidates from applications table to the new manager_pipeline table

INSERT INTO public.manager_pipeline (
  job_id,
  candidate_id,
  candidate_name,
  email,
  mobile_number,
  skills,
  experience_years,
  current_ctc,
  expected_ctc,
  notice_period,
  current_location,
  preferred_location,
  stage,
  stage_order,
  selection_status,
  feedback,
  score,
  assigned_recruiter,
  created_by,
  organization_id,
  created_at,
  updated_at
)
SELECT 
  a.job_id,
  a.candidate_id,
  a.candidate_name,
  c.email,
  c.mobile_number,
  a.skills,
  a.experience_years,
  c.current_ctc,
  c.expected_ctc,
  c.notice_period,
  c.current_location,
  c.preferred_location,
  -- Map application stage to manager pipeline stage
  CASE 
    WHEN a.stage = 'applied' THEN 'screening'
    WHEN a.stage = 'shortlisted' THEN 'shortlisted'
    WHEN a.stage = 'interview' THEN 'interview'
    WHEN a.stage = 'offer' THEN 'selection'
    WHEN a.stage = 'hired' OR a.stage = 'rejected' THEN 'closed'
    ELSE 'screening'
  END as stage,
  a.stage_order,
  -- Map candidate status to selection_status (only for selection stage)
  CASE 
    WHEN c.status = 'selected' THEN 'selected'
    WHEN c.status = 'selection_rejected' THEN 'selection_rejected'
    WHEN c.status = 'selection_hold' THEN 'selection_hold'
    ELSE NULL
  END as selection_status,
  c.feedback,
  a.score,
  c.assigned_to as assigned_recruiter,
  c.created_by as created_by,
  c.organization_id,
  a.applied_at as created_at,
  a.updated_at
FROM 
  public.applications a
  INNER JOIN public.candidates c ON a.candidate_id = c.id
WHERE
  -- Only migrate candidates that don't already exist in manager_pipeline
  NOT EXISTS (
    SELECT 1 FROM public.manager_pipeline mp 
    WHERE mp.job_id = a.job_id AND mp.candidate_id = a.candidate_id
  )
ON CONFLICT (job_id, candidate_id) DO NOTHING;

-- Log the migration
SELECT 
  COUNT(*) as migrated_count,
  'Records migrated to manager_pipeline' as message
FROM public.manager_pipeline;
