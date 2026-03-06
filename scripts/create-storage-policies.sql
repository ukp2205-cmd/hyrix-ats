-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('JobKarle-Resume', 'JobKarle-Resume', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (it should already be enabled, but this ensures it)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public uploads to JobKarle-Resume" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads from JobKarle-Resume" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to JobKarle-Resume" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from JobKarle-Resume" ON storage.objects;

-- Policy to allow anyone to upload files to the JobKarle-Resume bucket
CREATE POLICY "Allow public uploads to JobKarle-Resume"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'JobKarle-Resume');

-- Policy to allow anyone to view/download files from the JobKarle-Resume bucket
CREATE POLICY "Allow public downloads from JobKarle-Resume"
ON storage.objects
FOR SELECT
USING (bucket_id = 'JobKarle-Resume');

-- Policy to allow anyone to update files in the JobKarle-Resume bucket
CREATE POLICY "Allow public updates to JobKarle-Resume"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'JobKarle-Resume')
WITH CHECK (bucket_id = 'JobKarle-Resume');

-- Policy to allow anyone to delete files from the JobKarle-Resume bucket
CREATE POLICY "Allow public deletes from JobKarle-Resume"
ON storage.objects
FOR DELETE
USING (bucket_id = 'JobKarle-Resume');
