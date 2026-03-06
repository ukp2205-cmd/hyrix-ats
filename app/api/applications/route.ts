import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { job_id, candidate_id, candidate_name, experience_years, skills, stage, stage_order, applied_at } = body

    if (!job_id || !candidate_id) {
      return NextResponse.json({ success: false, error: 'job_id and candidate_id required' }, { status: 400 })
    }

    // Check if application already exists
    const existing = await db.queryOne(
      'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
      [job_id, candidate_id]
    )

    if (existing) {
      await db.execute(
        `UPDATE applications SET candidate_name = $1, experience_years = $2, skills = $3, updated_at = NOW() WHERE id = $4`,
        [candidate_name, experience_years || 0, JSON.stringify(skills || []), existing.id]
      )
    } else {
      await db.execute(
        `INSERT INTO applications (job_id, candidate_id, candidate_name, experience_years, skills, stage, stage_order, applied_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [job_id, candidate_id, candidate_name, experience_years || 0, JSON.stringify(skills || []), stage || 'applied', stage_order || 1, applied_at || new Date().toISOString()]
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[api/applications POST]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
