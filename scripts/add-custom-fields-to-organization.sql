-- Add custom_fields column to organization table to store active custom fields
ALTER TABLE organization 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{"quality_field": false}'::jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_organization_custom_fields ON organization USING gin(custom_fields);

-- Add comment
COMMENT ON COLUMN organization.custom_fields IS 'Stores active custom fields configuration for the organization';
