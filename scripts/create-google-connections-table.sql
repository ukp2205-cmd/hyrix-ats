CREATE TABLE IF NOT EXISTS google_connections (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID       NOT NULL,
  email          TEXT        NOT NULL,
  access_token   TEXT        NOT NULL,
  refresh_token  TEXT        NOT NULL,
  expiry_date    TIMESTAMPTZ NOT NULL,
  poll_interval_minutes INT  NOT NULL DEFAULT 5,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS google_connections_org_unique
  ON google_connections (organization_id);

CREATE OR REPLACE FUNCTION update_google_connections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS google_connections_updated_at ON google_connections;
CREATE TRIGGER google_connections_updated_at
  BEFORE UPDATE ON google_connections
  FOR EACH ROW EXECUTE FUNCTION update_google_connections_updated_at();
