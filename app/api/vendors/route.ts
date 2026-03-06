import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// Ensure table exists on first call
async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      company_name    TEXT NOT NULL,
      location        TEXT,
      gst_number      TEXT,
      pan_number      TEXT,
      cin_cert_url    TEXT,
      gst_cert_url    TEXT,
      pan_copy_url    TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `)
}

// GET  /api/vendors?organizationId=xxx
export async function GET(req: NextRequest) {
  try {
    await ensureTable()
    const orgId = req.nextUrl.searchParams.get('organizationId')
    if (!orgId) return NextResponse.json({ success: false, error: 'organizationId required' }, { status: 400 })

    const rows = await db.query(
      'SELECT * FROM vendors WHERE organization_id = $1 ORDER BY created_at DESC',
      [orgId]
    )
    return NextResponse.json({ success: true, vendors: rows })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST /api/vendors  — create
export async function POST(req: NextRequest) {
  try {
    await ensureTable()
    const body = await req.json()
    const { organization_id, company_name, location, gst_number, pan_number, cin_cert_url, gst_cert_url, pan_copy_url } = body

    if (!organization_id || !company_name) {
      return NextResponse.json({ success: false, error: 'organization_id and company_name are required' }, { status: 400 })
    }

    const rows = await db.query(
      `INSERT INTO vendors (organization_id, company_name, location, gst_number, pan_number, cin_cert_url, gst_cert_url, pan_copy_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [organization_id, company_name, location || null, gst_number || null, pan_number || null, cin_cert_url || null, gst_cert_url || null, pan_copy_url || null]
    )
    return NextResponse.json({ success: true, vendor: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// PUT  /api/vendors  — update
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, company_name, location, gst_number, pan_number, cin_cert_url, gst_cert_url, pan_copy_url } = body

    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    const rows = await db.query(
      `UPDATE vendors SET
         company_name = $1, location = $2, gst_number = $3, pan_number = $4,
         cin_cert_url = $5, gst_cert_url = $6, pan_copy_url = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [company_name, location || null, gst_number || null, pan_number || null, cin_cert_url || null, gst_cert_url || null, pan_copy_url || null, id]
    )
    return NextResponse.json({ success: true, vendor: rows[0] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// DELETE /api/vendors?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

    await db.query('DELETE FROM vendors WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
