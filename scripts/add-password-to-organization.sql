-- Add password column to organization table for admin authentication
-- This column will store bcrypt hashed passwords

-- Add password column
ALTER TABLE organization 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add email unique constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organization_email_unique'
    ) THEN
        ALTER TABLE organization 
        ADD CONSTRAINT organization_email_unique UNIQUE (email);
    END IF;
END $$;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_email ON organization(email);

-- Add mobile_number column if it doesn't exist
ALTER TABLE organization
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Add comment
COMMENT ON COLUMN organization.password_hash IS 'Bcrypt hashed password for admin authentication';
COMMENT ON COLUMN organization.mobile_number IS 'Admin contact mobile number';
