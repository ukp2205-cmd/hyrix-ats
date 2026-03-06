-- Create industries table
CREATE TABLE IF NOT EXISTS public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access to industries"
  ON public.industries
  FOR SELECT
  USING (true);

-- Create policy for authenticated insert
CREATE POLICY "Allow public insert access to industries"
  ON public.industries
  FOR INSERT
  WITH CHECK (true);

-- Create policy for authenticated update
CREATE POLICY "Allow public update access to industries"
  ON public.industries
  FOR UPDATE
  USING (true);

-- Create policy for authenticated delete
CREATE POLICY "Allow public delete access to industries"
  ON public.industries
  FOR DELETE
  USING (true);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS industries_name_idx ON public.industries(name);
