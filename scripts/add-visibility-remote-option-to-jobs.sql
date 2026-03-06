-- Add visibility and remote_option columns to jobs table

-- Add visibility column (public, private, internal)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';

-- Add remote_option column (office, remote, hybrid)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS remote_option TEXT DEFAULT 'office';

-- Add comments for documentation
COMMENT ON COLUMN jobs.visibility IS 'Job posting visibility: public, private, or internal';
COMMENT ON COLUMN jobs.remote_option IS 'Work location type: office, remote, or hybrid';
