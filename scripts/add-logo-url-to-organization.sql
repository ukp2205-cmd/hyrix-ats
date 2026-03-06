-- Add logo_url column to organization table
ALTER TABLE organization ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('hyrix_org_logo', 'hyrix_org_logo', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket
CREATE POLICY "Allow public read access to logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'hyrix_org_logo');

CREATE POLICY "Allow authenticated users to upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hyrix_org_logo');

CREATE POLICY "Allow authenticated users to update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'hyrix_org_logo');

CREATE POLICY "Allow authenticated users to delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'hyrix_org_logo');
