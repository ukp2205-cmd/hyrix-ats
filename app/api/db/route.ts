import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// ---------------------------------------------------------------------------
// Central DB API endpoint — used by the browser-side createClient() shim
// Supports: select, insert, update, upsert, delete with full filter support
// Filter ops: =, !=, ilike, like, in, is, not.*, @>, >, >=, <, <=
// ---------------------------------------------------------------------------

const ALLOWED_TABLES = [
  'candidates', 'jobs', 'organization', 'org_team', 'industries',
  'departments', 'clients', 'applications', 'templates', 'permissions',
  'role_permissions', 'user_roles', 'cities', 'states', 'skills',
  'manager_pipeline', 'teams', 'team_members', 'bd_leads', 'designations',
  'vendors',
]

type FilterOp = { column: string; op: string; value: any }
type OrderOp  = { column: string; ascending: boolean }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { op, table, select, data, filters = [], orders = [], limit, offset, opts } = body

    // Validate table name (prevent SQL injection via table name)
    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: { message: `Table '${table}' is not allowed` } }, { status: 400 })
    }

    // --- SELECT ---
    if (op === 'select') {
      const { whereClause, whereParams } = buildWhere(filters, 0)
      const orderClause = (orders as OrderOp[]).length
        ? ' ORDER BY ' + (orders as OrderOp[]).map(o => `"${o.column}" ${o.ascending ? 'ASC' : 'DESC'}`).join(', ')
        : ''
      const limitClause  = limit  != null ? ` LIMIT ${limit}`  : ''
      const offsetClause = offset != null ? ` OFFSET ${offset}` : ''
      const cols = (!select || select === '*') ? '*' : select
      const sql = `SELECT ${cols} FROM "${table}"${whereClause}${orderClause}${limitClause}${offsetClause}`
      const rows = await db.query(sql, whereParams)
      return NextResponse.json({ data: rows })
    }

    // --- INSERT ---
    if (op === 'insert') {
      const rows = Array.isArray(data) ? data : [data]
      if (rows.length === 0) return NextResponse.json({ data: [] })
      const keys = Object.keys(rows[0])
      const cols = keys.map(k => `"${k}"`).join(', ')
      const results: any[] = []
      for (const row of rows) {
        const vals = keys.map(k => row[k])
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
        const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`
        const inserted = await db.query(sql, vals)
        results.push(...inserted)
      }
      return NextResponse.json({ data: results })
    }

    // --- UPSERT ---
    if (op === 'upsert') {
      const rows = Array.isArray(data) ? data : [data]
      if (rows.length === 0) return NextResponse.json({ data: [] })
      const keys = Object.keys(rows[0])
      const cols = keys.map(k => `"${k}"`).join(', ')
      const results: any[] = []
      for (const row of rows) {
        const vals = keys.map(k => row[k])
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
        const updateSet = keys.map((k, i) => `"${k}" = EXCLUDED."${k}"`).join(', ')
        const conflictCol = opts?.onConflict ? `("${opts.onConflict}")` : ''
        const sql = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT ${conflictCol} DO UPDATE SET ${updateSet} RETURNING *`
        const upserted = await db.query(sql, vals)
        results.push(...upserted)
      }
      return NextResponse.json({ data: results })
    }

    // --- UPDATE ---
    if (op === 'update') {
      const keys = Object.keys(data)
      if (keys.length === 0) return NextResponse.json({ data: [] })
      const { whereClause, whereParams } = buildWhere(filters, keys.length)
      const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
      const sql = `UPDATE "${table}" SET ${setClause}${whereClause} RETURNING *`
      const vals = [...keys.map((k: string) => data[k]), ...whereParams]
      const updated = await db.query(sql, vals)
      return NextResponse.json({ data: updated })
    }

    // --- DELETE ---
    if (op === 'delete') {
      const { whereClause, whereParams } = buildWhere(filters, 0)
      if (!whereClause) {
        // Safety: never allow unfiltered deletes
        return NextResponse.json({ error: { message: 'DELETE requires at least one filter' } }, { status: 400 })
      }
      const sql = `DELETE FROM "${table}"${whereClause} RETURNING *`
      const deleted = await db.query(sql, whereParams)
      return NextResponse.json({ data: deleted })
    }

    return NextResponse.json({ error: { message: `Unknown op: ${op}` } }, { status: 400 })

  } catch (err: any) {
    console.error('[v0] /api/db error:', err.message)
    return NextResponse.json({ error: { message: err.message, code: err.code } }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
function buildWhere(filters: FilterOp[], paramOffset: number) {
  if (!filters?.length) return { whereClause: '', whereParams: [] }
  const params: any[] = []
  const parts = filters.map(f => {
    const idx = paramOffset + params.length + 1

    // Handle not.* negation prefix
    if (f.op.startsWith('not.')) {
      const innerOp = f.op.slice(4) // strip 'not.'
      if (innerOp === 'is') return `"${f.column}" IS NOT ${f.value === null ? 'NULL' : 'NOT NULL'}`
      if (innerOp === 'in') {
        const ph = (f.value as any[]).map((_, i) => `$${idx + i}`).join(', ')
        params.push(...f.value)
        return `"${f.column}" NOT IN (${ph})`
      }
      if (innerOp === 'ilike') { params.push(f.value); return `"${f.column}" NOT ILIKE $${idx}` }
      if (innerOp === 'like')  { params.push(f.value); return `"${f.column}" NOT LIKE $${idx}` }
      params.push(f.value)
      return `"${f.column}" <> $${idx}`
    }

    if (f.op === 'is')  return `"${f.column}" IS ${f.value === null ? 'NULL' : 'NOT NULL'}`
    if (f.op === '!=')  { params.push(f.value); return `"${f.column}" != $${idx}` }
    if (f.op === 'neq') { params.push(f.value); return `"${f.column}" != $${idx}` }
    if (f.op === 'in') {
      const ph = (f.value as any[]).map((_, i) => `$${idx + i}`).join(', ')
      params.push(...f.value)
      return `"${f.column}" IN (${ph})`
    }
    if (f.op === 'ilike') { params.push(f.value); return `"${f.column}" ILIKE $${idx}` }
    if (f.op === 'like')  { params.push(f.value); return `"${f.column}" LIKE $${idx}` }
    if (f.op === '@>')    { params.push(JSON.stringify(f.value)); return `"${f.column}" @> $${idx}::jsonb` }
    params.push(f.value)
    return `"${f.column}" ${f.op} $${idx}`
  })
  return { whereClause: ' WHERE ' + parts.join(' AND '), whereParams: params }
}
