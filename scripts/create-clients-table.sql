-- Create clients table for managing client companies
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  company_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  industry text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES public.organization(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
CREATE POLICY "Allow public read access to clients" ON public.clients
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to clients" ON public.clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to clients" ON public.clients
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to clients" ON public.clients
  FOR DELETE USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
