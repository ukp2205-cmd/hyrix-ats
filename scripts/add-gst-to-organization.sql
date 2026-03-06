-- Add GST column to organization table
-- This will store the GST number for the company/organization

ALTER TABLE organization 
ADD COLUMN IF NOT EXISTS gst TEXT;

COMMENT ON COLUMN organization.gst IS 'GST (Goods and Services Tax) number for the organization';
