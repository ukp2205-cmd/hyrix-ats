import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  host:     process.env.LIGHTSAIL_DB_HOST,
  port:     Number(process.env.LIGHTSAIL_DB_PORT) || 5432,
  user:     process.env.LIGHTSAIL_DB_USER,
  password: process.env.LIGHTSAIL_DB_PASSWORD,
  database: process.env.LIGHTSAIL_DB_NAME,
  ssl: { rejectUnauthorized: false },
})

const SQL = `
CREATE TABLE IF NOT EXISTS bd_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID,

  -- Company Information
  company_name     VARCHAR(255) NOT NULL,
  industry         VARCHAR(100),
  num_employees    INTEGER,
  annual_revenue   BIGINT,
  website          VARCHAR(255),
  company_phone    VARCHAR(50),
  company_email    VARCHAR(255),

  -- Contact Person
  first_name       VARCHAR(100),
  last_name        VARCHAR(100),
  title            VARCHAR(100),
  contact_email    VARCHAR(255),
  phone            VARCHAR(50),
  mobile           VARCHAR(50),

  -- Additional Contact
  skype_id         VARCHAR(100),
  linkedin_url     VARCHAR(500),
  secondary_email  VARCHAR(255),
  twitter_id       VARCHAR(100),

  -- Lead Info
  lead_source      VARCHAR(100),
  lead_status      VARCHAR(100) DEFAULT 'New Lead',

  -- Address
  street           VARCHAR(255),
  city             VARCHAR(100),
  state            VARCHAR(100),
  country          VARCHAR(100),
  zip              VARCHAR(20),

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bd_leads_org_idx ON bd_leads (organization_id);
`

async function run() {
  const client = await pool.connect()
  try {
    console.log('Connected to Postgres. Creating bd_leads table...')
    await client.query(SQL)
    console.log('bd_leads table created (or already exists).')

    // Verify
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'bd_leads'
      ORDER BY ordinal_position
    `)
    console.log('Columns:', res.rows.map(r => r.column_name).join(', '))
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
