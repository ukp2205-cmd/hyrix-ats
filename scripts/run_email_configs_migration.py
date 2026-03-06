import os
import psycopg2

host     = os.environ.get('LIGHTSAIL_DB_HOST', '')
port     = int(os.environ.get('LIGHTSAIL_DB_PORT', 5432))
user     = os.environ.get('LIGHTSAIL_DB_USER', '')
password = os.environ.get('LIGHTSAIL_DB_PASSWORD', '')
dbname   = os.environ.get('LIGHTSAIL_DB_NAME', '')

print("=== DB Migration: email_configs table ===")
print(f"  Host   : {host}")
print(f"  Port   : {port}")
print(f"  User   : {user}")
print(f"  DB     : {dbname}")
print(f"  PW set : {'yes' if password else 'NO - MISSING'}")

if not all([host, user, password, dbname]):
    print("\nERROR: One or more LIGHTSAIL_DB_* env vars are missing. Cannot connect.")
    exit(1)

sql = """
CREATE TABLE IF NOT EXISTS email_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       TEXT NOT NULL,
  imap_host             TEXT NOT NULL,
  imap_port             INT  NOT NULL DEFAULT 993,
  username              TEXT NOT NULL,
  encrypted_password    TEXT NOT NULL,
  folder                TEXT NOT NULL DEFAULT 'INBOX',
  use_tls               BOOLEAN NOT NULL DEFAULT TRUE,
  poll_interval_minutes INT NOT NULL DEFAULT 5,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_configs_org_unique
  ON email_configs (organization_id);

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
"""

try:
    conn = psycopg2.connect(
        host=host, port=port, user=user,
        password=password, dbname=dbname,
        sslmode='require',
        connect_timeout=15,
    )
    conn.autocommit = True
    cur = conn.cursor()

    print("\nRunning migration...")
    cur.execute(sql)
    print("Migration executed successfully.")

    # Verify table exists
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'email_configs'
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    if cols:
        print(f"\nTable 'email_configs' verified — {len(cols)} columns:")
        for col in cols:
            print(f"  {col[0]:<30} {col[1]}")
    else:
        print("\nWARNING: Table was not found after migration.")

    cur.close()
    conn.close()
    print("\nDone. Table is ready in your database.")

except Exception as e:
    print(f"\nERROR: {type(e).__name__}: {e}")
    exit(1)
