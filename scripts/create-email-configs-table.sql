-- Email configuration table for IMAP inbox polling
CREATE TABLE IF NOT EXISTS email_configs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL,
  imap_host            TEXT NOT NULL,
  imap_port            INT  NOT NULL DEFAULT 993,
  username             TEXT NOT NULL,
  encrypted_password   TEXT NOT NULL,
  folder               TEXT NOT NULL DEFAULT 'INBOX',
  use_tls              BOOLEAN NOT NULL DEFAULT TRUE,
  poll_interval_minutes INT NOT NULL DEFAULT 5,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One config per organization
CREATE UNIQUE INDEX IF NOT EXISTS email_configs_org_unique
  ON email_configs (organization_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_configs_updated_at ON email_configs;
CREATE TRIGGER email_configs_updated_at
  BEFORE UPDATE ON email_configs
  FOR EACH ROW EXECUTE FUNCTION update_email_configs_updated_at();
