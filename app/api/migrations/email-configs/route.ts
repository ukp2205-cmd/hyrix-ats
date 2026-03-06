import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  console.log('[v0] Running email_configs migration...')
  try {
    // Step 1: Create table
    await db.execute(`
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
      )
    `)
    console.log('[v0] Table created (or already exists)')

    // Step 2: Unique index
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS email_configs_org_unique
        ON email_configs (organization_id)
    `)
    console.log('[v0] Unique index created')

    // Step 3: Trigger function
    await db.execute(`
      CREATE OR REPLACE FUNCTION update_email_configs_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$
    `)

    // Step 4: Trigger
    await db.execute(`DROP TRIGGER IF EXISTS email_configs_updated_at ON email_configs`)
    await db.execute(`
      CREATE TRIGGER email_configs_updated_at
        BEFORE UPDATE ON email_configs
        FOR EACH ROW EXECUTE FUNCTION update_email_configs_updated_at()
    `)
    console.log('[v0] Trigger created')

    // Step 5: Verify — list columns
    const columns = await db.query<{ column_name: string; data_type: string }>(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'email_configs'
      ORDER BY ordinal_position
    `)
    console.log('[v0] Migration complete — columns:', columns.map(c => c.column_name).join(', '))

    return NextResponse.json({
      success: true,
      message: 'email_configs table created successfully',
      columns: columns.map(c => ({ name: c.column_name, type: c.data_type })),
    })

  } catch (err: any) {
    console.error('[v0] Migration failed:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
