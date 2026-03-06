import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId')
  if (!orgId) return NextResponse.json({ connection: null })

  try {
    const conn = await db.queryOne<any>(
      `SELECT email, created_at AS connected_at FROM google_connections WHERE organization_id = $1 AND is_active = true`,
      [orgId]
    )
    return NextResponse.json({ connection: conn || null })
  } catch (err: any) {
    // Table may not exist yet — return null gracefully
    if (err.message?.includes('does not exist') || err.message?.includes('42P01')) {
      return NextResponse.json({ connection: null })
    }
    return NextResponse.json({ connection: null, error: err.message })
  }
}
