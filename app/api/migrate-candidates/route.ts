import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    await db.query(`
      ALTER TABLE candidates ALTER COLUMN email DROP NOT NULL;
    `).catch(() => {})

    await db.query(`
      ALTER TABLE candidates ALTER COLUMN mobile_number DROP NOT NULL;
    `).catch(() => {})

    await db.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assigned_to TEXT`).catch(() => {})
    await db.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_ids TEXT[]`).catch(() => {})
    await db.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS quality TEXT`).catch(() => {})
    await db.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS feedback TEXT`).catch(() => {})
    await db.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cv_url TEXT`).catch(() => {})
    await db.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS buyout_available TEXT`).catch(() => {})
    await db.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS preferred_location_array TEXT[]`).catch(() => {})
    await db.query(`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`).catch(() => {})
    await db.query(`ALTER TABLE candidates ALTER COLUMN created_by TYPE TEXT USING COALESCE(created_by::TEXT, '')`).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}
