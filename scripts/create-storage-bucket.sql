-- Create JobKarle-Resume storage bucket if it doesn't exist
-- Note: This should be run with appropriate permissions

-- Create the bucket (public access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'JobKarle-Resume',
  'JobKarle-Resume',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Note: RLS policies for storage.objects need to be created in Supabase dashboard
-- or using service role key as they require special permissions

-- If you have admin access, uncomment and run these policies:

/*
-- Allow anyone to upload files
CREATE POLICY "Allow public uploads to JobKarle-Resume"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'JobKarle-Resume');

-- Allow anyone to read files
CREATE POLICY "Allow public reads from JobKarle-Resume"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'JobKarle-Resume');

-- Allow anyone to update their files
CREATE POLICY "Allow public updates to JobKarle-Resume"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'JobKarle-Resume');

-- Allow anyone to delete files
CREATE POLICY "Allow public deletes from JobKarle-Resume"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'JobKarle-Resume');
*/
