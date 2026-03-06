import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET — fetch candidates (for dashboard / list)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const organizationId = searchParams.get('organizationId')
  const recruiterId    = searchParams.get('recruiterId')
  const id             = searchParams.get('id')

  try {
    if (id) {
      const row = await db.queryOne('SELECT * FROM candidates WHERE id = $1', [id])
      return NextResponse.json({ success: true, candidate: row })
    }

    // If no organizationId provided but recruiterId is, look up org from org_team
    let resolvedOrgId = organizationId
    if (!resolvedOrgId && recruiterId) {
      const teamRow = await db.queryOne(
        'SELECT organization_id FROM org_team WHERE id = $1',
        [recruiterId]
      )
      resolvedOrgId = teamRow?.organization_id ?? null
    }

    if (!resolvedOrgId) {
      return NextResponse.json({ success: false, error: 'organizationId required' }, { status: 400 })
    }

    let rows
    if (recruiterId) {
      // Fetch candidates created by this recruiter (created_by column)
      rows = await db.query(
        `SELECT * FROM candidates
         WHERE organization_id = $1 AND created_by = $2
         ORDER BY created_at DESC`,
        [resolvedOrgId, recruiterId]
      )
    } else {
      rows = await db.query(
        'SELECT * FROM candidates WHERE organization_id = $1 ORDER BY created_at DESC',
        [resolvedOrgId]
      )
    }
    return NextResponse.json({ success: true, candidates: rows })
  } catch (err: any) {
    console.error('[api/candidates GET]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// POST — create or update candidate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mode, id: candidateId, ...payload } = body

    // Validate required fields
    if (!payload.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }
    if (!payload.organization_id) {
      return NextResponse.json({ success: false, error: 'organization_id is required' }, { status: 400 })
    }

    // Duplicate check on create
    if (mode !== 'update') {
      if (payload.mobile_number?.trim()) {
        const dup = await db.queryOne(
          'SELECT id FROM candidates WHERE mobile_number = $1 AND organization_id = $2 LIMIT 1',
          [payload.mobile_number.trim(), payload.organization_id]
        )
        if (dup) {
          return NextResponse.json({
            success: false,
            duplicate: true,
            error: `A candidate with phone ${payload.mobile_number} already exists in your organisation.`,
          }, { status: 409 })
        }
      }
      if (payload.email?.trim()) {
        const dup = await db.queryOne(
          'SELECT id FROM candidates WHERE email = $1 AND organization_id = $2 LIMIT 1',
          [payload.email.trim(), payload.organization_id]
        )
        if (dup) {
          return NextResponse.json({
            success: false,
            duplicate: true,
            error: `A candidate with email ${payload.email} already exists in your organisation.`,
          }, { status: 409 })
        }
      }
    }

    // Whitelist of known candidates table columns — prevents crash on unknown column
    const ALLOWED_COLUMNS = new Set([
      'name', 'mobile_number', 'email', 'current_location', 'preferred_location',
      'preferred_location_array', 'area', 'skills', 'industry', 'designation',
      'years_of_experience', 'experience_years',
      'current_ctc', 'expected_ctc', 'notice_period', 'buyout_available',
      'source', 'feedback', 'status', 'quality', 'cv_url',
      'organization_id', 'job_id', 'job_ids', 'assigned_to', 'created_by',
    ])

    // Sanitise: convert empty strings to null for nullable fields
    const NULLABLE_FIELDS = new Set([
      'email', 'mobile_number', 'area', 'designation', 'industry',
      'current_ctc', 'expected_ctc', 'feedback', 'quality', 'cv_url',
      'source', 'job_id', 'job_ids', 'assigned_to', 'created_by',
      'preferred_location', 'preferred_location_array',
    ])
    for (const key of Object.keys(payload)) {
      if (NULLABLE_FIELDS.has(key) && payload[key] === '') {
        payload[key] = null
      }
    }

    // Remove assigned_to — FK constraint on org_team causes failures for super_admin.
    delete payload.assigned_to

    // Remove created_by if it equals organization_id (super_admin has no org_team row).
    // For actual recruiters, created_by = their org_team.id which is a valid FK value.
    if (payload.created_by && payload.created_by === payload.organization_id) {
      delete payload.created_by
    }

    if (mode === 'update' && candidateId) {
      // UPDATE — only known columns
      const fields = Object.keys(payload).filter(k => ALLOWED_COLUMNS.has(k))
      if (fields.length === 0) {
        return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
      }
      const setClauses = fields.map((f, i) => `"${f}" = $${i + 1}`).join(', ')
      const values     = [...fields.map(f => payload[f]), candidateId]

      const rows = await db.query(
        `UPDATE candidates SET ${setClauses}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      )
      return NextResponse.json({ success: true, candidate: rows[0] })
    } else {
      // INSERT — only known columns
      const fields = Object.keys(payload).filter(k => ALLOWED_COLUMNS.has(k))
      const cols   = fields.map(f => `"${f}"`).join(', ')
      const vals   = fields.map((_, i) => `$${i + 1}`).join(', ')
      const values = fields.map(f => payload[f])

      let rows: any[]
      try {
        rows = await db.query(
          `INSERT INTO candidates (${cols}, created_at, updated_at)
           VALUES (${vals}, NOW(), NOW()) RETURNING *`,
          values
        )
      } catch (insertErr: any) {
        // Fallback: insert without updated_at if column doesn't exist yet
        if (insertErr.message?.includes('updated_at')) {
          rows = await db.query(
            `INSERT INTO candidates (${cols}, created_at)
             VALUES (${vals}, NOW()) RETURNING *`,
            values
          )
        } else {
          throw insertErr
        }
      }
      return NextResponse.json({ success: true, candidate: rows[0] })
    }
  } catch (err: any) {
    console.error('[api/candidates POST]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
