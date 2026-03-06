-- BD Leads table for Business Development feature
CREATE TABLE IF NOT EXISTS "bd_leads" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id"  UUID,

  -- Company Information
  "company_name"     VARCHAR(255) NOT NULL,
  "industry"         VARCHAR(100),
  "num_employees"    INTEGER,
  "annual_revenue"   BIGINT,
  "website"          VARCHAR(255),
  "company_phone"    VARCHAR(50),
  "company_email"    VARCHAR(255),

  -- Contact Person
  "first_name"       VARCHAR(100),
  "last_name"        VARCHAR(100),
  "title"            VARCHAR(100),
  "contact_email"    VARCHAR(255),
  "phone"            VARCHAR(50),
  "mobile"           VARCHAR(50),

  -- Additional Contact
  "skype_id"         VARCHAR(100),
  "linkedin_url"     VARCHAR(500),
  "secondary_email"  VARCHAR(255),
  "twitter_id"       VARCHAR(100),

  -- Lead Info
  "lead_source"      VARCHAR(100),
  "lead_status"      VARCHAR(100) DEFAULT 'New Lead',

  -- Address
  "street"           VARCHAR(255),
  "city"             VARCHAR(100),
  "state"            VARCHAR(100),
  "country"          VARCHAR(100),
  "zip"              VARCHAR(20),

  "created_at"       TIMESTAMPTZ DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for org-scoped queries
CREATE INDEX IF NOT EXISTS "bd_leads_org_idx" ON "bd_leads" ("organization_id");
