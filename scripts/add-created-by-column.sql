-- Add created_by column to manager_pipeline table for tracking who created the entry
-- References org_team.user_id which is the auth.users UUID
ALTER TABLE public.manager_pipeline 
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create index for better performance when filtering by created_by
CREATE INDEX IF NOT EXISTS idx_manager_pipeline_created_by 
ON public.manager_pipeline(created_by);

-- Also create index for assigned_recruiter if not exists
CREATE INDEX IF NOT EXISTS idx_manager_pipeline_assigned_recruiter 
ON public.manager_pipeline(assigned_recruiter);

-- For existing records, map created_by from org_team.user_id based on assigned_recruiter
UPDATE public.manager_pipeline mp
SET created_by = ot.user_id
FROM public.org_team ot
WHERE mp.assigned_recruiter = ot.id 
AND mp.created_by IS NULL;
