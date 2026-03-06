# Storage Bucket Setup for JobKarle-Resume

## Issue
CV uploads are failing with "new row violates row-level security policy" error because the storage bucket needs proper configuration.

## Solution
You need to create the storage bucket with proper RLS policies in Supabase.

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Storage** section
3. Click **New Bucket**
4. Create bucket with name: `JobKarle-Resume`
5. Set as **Public bucket**
6. Go to **Policies** tab
7. Create the following policies:

**Policy for Upload (INSERT)**:
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'JobKarle-Resume');
```

**Policy for Read (SELECT)**:
```sql
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'JobKarle-Resume');
```

**Policy for Delete (DELETE)**:
```sql
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'JobKarle-Resume');
```

### Option 2: Use Service Role Key
If you want unrestricted access (not recommended for production), use the service role key instead of anon key for uploads.

## After Setup
Once the bucket is created with proper policies, the CV upload feature will work correctly.
