import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SQL = `
CREATE TABLE IF NOT EXISTS bd_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID,
  company_name     VARCHAR(255) NOT NULL,
  industry         VARCHAR(100),
  num_employees    INTEGER,
  annual_revenue   BIGINT,
  website          VARCHAR(255),
  company_phone    VARCHAR(50),
  company_email    VARCHAR(255),
  first_name       VARCHAR(100),
  last_name        VARCHAR(100),
  title            VARCHAR(100),
  contact_email    VARCHAR(255),
  phone            VARCHAR(50),
  mobile           VARCHAR(50),
  skype_id         VARCHAR(100),
  linkedin_url     VARCHAR(500),
  secondary_email  VARCHAR(255),
  twitter_id       VARCHAR(100),
  lead_source      VARCHAR(100),
  lead_status      VARCHAR(100) DEFAULT 'New Lead',
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

export async function GET() {
  try {
    await db.execute(SQL)

    // Verify columns exist
    const cols = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'bd_leads' ORDER BY ordinal_position`
    )
    return NextResponse.json({
      success: true,
      message: 'bd_leads table ready',
      columns: cols.map(c => c.column_name),
    })
  } catch (err: any) {
    console.error('[v0] migrate-bd-leads error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
