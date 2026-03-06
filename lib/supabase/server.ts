// ---------------------------------------------------------------------------
// Server-side client — uses direct pg pool (no HTTP round-trip overhead)
// All server actions and route handlers should use this.
// ---------------------------------------------------------------------------
import db from '@/lib/db'

// Maps the same .from().select/insert/update/delete chaining used across the
// codebase but executes queries directly via the pg pool.
export async function createClient() {
  return buildServerClient()
}

function buildServerClient() {
  return {
    from(table: string) {
      return new ServerQueryBuilder(table)
    },
    storage: {
      from() {
        return {
          getPublicUrl(path: string) {
            const endpoint = process.env.LIGHTSAIL_STORAGE_ENDPOINT || ''
            const bucket = process.env.LIGHTSAIL_STORAGE_BUCKET || ''
            return {
              data: {
                publicUrl: `${endpoint.replace(/\/$/, '')}/${bucket}/${path}`
              }
            }
          }
        }
      }
    },
    auth: {
      async getUser() { return { data: { user: null }, error: null } },
      async getSession() { return { data: { session: null }, error: null } },
    }
  }
}

type FilterOp = { column: string; op: string; value: any }
type OrderOp  = { column: string; ascending: boolean }

class ServerQueryBuilder {
  private _table: string
  private _select: string = '*'
  private _filters: FilterOp[] = []
  private _orders: OrderOp[] = []
  private _limit: number | null = null
  private _offset: number | null = null
  private _single: boolean = false
  private _maybeSingle: boolean = false

  constructor(table: string) { this._table = table }

  select(columns: string = '*') { this._select = columns; return this }
  eq(col: string, val: any)    { this._filters.push({ column: col, op: '=',     value: val }); return this }
  neq(col: string, val: any)   { this._filters.push({ column: col, op: '!=',    value: val }); return this }
  ilike(col: string, val: any) { this._filters.push({ column: col, op: 'ilike', value: val }); return this }
  like(col: string, val: any)  { this._filters.push({ column: col, op: 'like',  value: val }); return this }
  gt(col: string, val: any)    { this._filters.push({ column: col, op: '>',     value: val }); return this }
  gte(col: string, val: any)   { this._filters.push({ column: col, op: '>=',    value: val }); return this }
  lt(col: string, val: any)    { this._filters.push({ column: col, op: '<',     value: val }); return this }
  lte(col: string, val: any)   { this._filters.push({ column: col, op: '<=',    value: val }); return this }
  in(col: string, vals: any[]) { this._filters.push({ column: col, op: 'in',    value: vals }); return this }
  is(col: string, val: any)    { this._filters.push({ column: col, op: 'is',    value: val }); return this }
  not(col: string, op: string, val: any) { this._filters.push({ column: col, op: `not.${op}`, value: val }); return this }
  order(col: string, opts?: { ascending?: boolean }) { this._orders.push({ column: col, ascending: opts?.ascending ?? true }); return this }
  limit(n: number)   { this._limit = n;  return this }
  range(from: number, to: number) { this._offset = from; this._limit = to - from + 1; return this }

  single()      { this._single = true;      this._limit = 1; return this._run() }
  maybeSingle() { this._maybeSingle = true; this._limit = 1; return this._run() }

  then(resolve: (val: any) => any, reject?: (err: any) => any) {
    return this._run().then(resolve, reject)
  }

  // --- Mutations ---
  insert(data: any | any[]) { return this._mutate('insert', data) }
  update(data: any)         { return this._mutate('update', data) }
  upsert(data: any | any[]) { return this._mutate('upsert', data) }
  delete()                  { return this._mutate('delete', null)  }

  private async _mutate(op: string, data: any) {
    try {
      const rows = Array.isArray(data) ? data : data ? [data] : []

      if (op === 'insert' || op === 'upsert') {
        if (rows.length === 0) return { data: [], error: null }
        const keys = Object.keys(rows[0])
        const cols = keys.map(k => `"${k}"`).join(', ')
        const results: any[] = []
        for (const row of rows) {
          const vals = keys.map(k => row[k])
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
          let sql = `INSERT INTO "${this._table}" (${cols}) VALUES (${placeholders})`
          if (op === 'upsert') sql += ` ON CONFLICT DO UPDATE SET ${keys.map((k, i) => `"${k}"=$${i + 1}`).join(', ')}`
          sql += ' RETURNING *'
          const inserted = await db.query(sql, vals)
          results.push(...inserted)
        }
        return { data: results, error: null }
      }

      if (op === 'update') {
        const keys = Object.keys(data)
        if (keys.length === 0) return { data: [], error: null }
        const { whereClause, whereParams } = buildWhere(this._filters, keys.length)
        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
        const sql = `UPDATE "${this._table}" SET ${setClause}${whereClause} RETURNING *`
        const vals = [...keys.map(k => data[k]), ...whereParams]
        const updated = await db.query(sql, vals)
        return { data: updated, error: null }
      }

      if (op === 'delete') {
        const { whereClause, whereParams } = buildWhere(this._filters, 0)
        const sql = `DELETE FROM "${this._table}"${whereClause} RETURNING *`
        const deleted = await db.query(sql, whereParams)
        return { data: deleted, error: null }
      }

      return { data: null, error: { message: `Unknown op: ${op}` } }
    } catch (err: any) {
      console.error(`[v0] DB mutate error (${op} ${this._table}):`, err.message)
      return { data: null, error: { message: err.message, code: err.code } }
    }
  }

  private async _run() {
    try {
      const { whereClause, whereParams } = buildWhere(this._filters, 0)
      const orderClause = this._orders.length
        ? ' ORDER BY ' + this._orders.map(o => `"${o.column}" ${o.ascending ? 'ASC' : 'DESC'}`).join(', ')
        : ''
      const limitClause  = this._limit  != null ? ` LIMIT ${this._limit}`  : ''
      const offsetClause = this._offset != null ? ` OFFSET ${this._offset}` : ''

      // Build SELECT columns (handle joins like "id, candidates(*)")
      const selectCols = this._select === '*' ? '*' : this._select

      const sql = `SELECT ${selectCols} FROM "${this._table}"${whereClause}${orderClause}${limitClause}${offsetClause}`
      const rows = await db.query(sql, whereParams)

      if (this._single) {
        if (!rows || rows.length === 0) return { data: null, error: { message: 'No rows found', code: 'PGRST116' } }
        return { data: rows[0], error: null }
      }
      if (this._maybeSingle) return { data: rows?.[0] ?? null, error: null }
      return { data: rows, error: null }
    } catch (err: any) {
      console.error(`[v0] DB select error (${this._table}):`, err.message)
      return { data: null, error: { message: err.message, code: err.code } }
    }
  }
}

// ---------------------------------------------------------------------------
// Build parameterised WHERE clause from filter array
// ---------------------------------------------------------------------------
function buildWhere(filters: FilterOp[], paramOffset: number) {
  if (!filters.length) return { whereClause: '', whereParams: [] }
  const params: any[] = []
  const parts = filters.map(f => {
    const idx = paramOffset + params.length + 1
    if (f.op === 'is') {
      return `"${f.column}" IS ${f.value === null ? 'NULL' : 'NOT NULL'}`
    }
    if (f.op === 'in') {
      const placeholders = (f.value as any[]).map((_, i) => `$${idx + i}`).join(', ')
      params.push(...f.value)
      return `"${f.column}" IN (${placeholders})`
    }
    if (f.op === 'ilike') {
      params.push(f.value)
      return `"${f.column}" ILIKE $${idx}`
    }
    if (f.op === '@>') {
      params.push(JSON.stringify(f.value))
      return `"${f.column}" @> $${idx}::jsonb`
    }
    params.push(f.value)
    return `"${f.column}" ${f.op} $${idx}`
  })
  return { whereClause: ' WHERE ' + parts.join(' AND '), whereParams: params }
}
