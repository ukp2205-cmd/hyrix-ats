-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  location TEXT NOT NULL,
  hiring_manager_id UUID REFERENCES public.org_team(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organization(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_name, location, organization_id)
);

-- Create team_recruiters junction table
CREATE TABLE IF NOT EXISTS public.team_recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES public.org_team(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, recruiter_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_recruiters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Allow public read access to teams"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to teams"
  ON public.teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to teams"
  ON public.teams FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to teams"
  ON public.teams FOR DELETE
  USING (true);

-- RLS Policies for team_recruiters
CREATE POLICY "Allow public read access to team_recruiters"
  ON public.team_recruiters FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to team_recruiters"
  ON public.team_recruiters FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to team_recruiters"
  ON public.team_recruiters FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to team_recruiters"
  ON public.team_recruiters FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_organization ON public.teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_hiring_manager ON public.teams(hiring_manager_id);
CREATE INDEX IF NOT EXISTS idx_team_recruiters_team ON public.team_recruiters(team_id);
CREATE INDEX IF NOT EXISTS idx_team_recruiters_recruiter ON public.team_recruiters(recruiter_id);
