'use client'

// ---------------------------------------------------------------------------
// Supabase → PostgreSQL migration shim
// Maps .from().select/insert/update/delete/upsert chaining to /api/db route.
// ---------------------------------------------------------------------------

type FilterOp = { column: string; op: string; value: any }
type OrderOp  = { column: string; ascending: boolean }

export function createClient() {
  return {
    from(table: string) {
      return makeQueryBuilder('/api/db', table)
    },
    storage: {
      from() {
        return {
          getPublicUrl(path: string) {
            const endpoint = process.env.NEXT_PUBLIC_LIGHTSAIL_STORAGE_ENDPOINT || ''
            const bucket   = process.env.NEXT_PUBLIC_LIGHTSAIL_STORAGE_BUCKET   || ''
            return { data: { publicUrl: `${endpoint.replace(/\/$/, '')}/${bucket}/${path}` } }
          },
        }
      },
    },
    auth: {
      async getUser()    { return { data: { user: null },    error: null } },
      async getSession() { return { data: { session: null }, error: null } },
    },
  }
}

// ---------------------------------------------------------------------------
// Query builder (SELECT)
// ---------------------------------------------------------------------------
function makeQueryBuilder(apiBase: string, table: string) {
  let _select  = '*'
  let _filters: FilterOp[] = []
  let _orders:  OrderOp[]  = []
  let _limit:   number | null = null
  let _offset:  number | null = null
  let _single      = false
  let _maybeSingle = false

  async function _executeSelect() {
    const payload = { op: 'select', table, select: _select, filters: _filters, orders: _orders, limit: _limit, offset: _offset }
    try {
      const res  = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) return { data: null, error: json.error ?? { message: json.message } }
      const rows = json.data as any[]
      if (_single) {
        if (!rows || rows.length === 0) return { data: null, error: { message: 'No rows found', code: 'PGRST116' } }
        return { data: rows[0], error: null }
      }
      if (_maybeSingle) return { data: rows?.[0] ?? null, error: null }
      return { data: rows, error: null }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  }

  const builder = {
    select(cols = '*')                        { _select = cols;                                                   return builder },
    eq(col: string, val: any)                 { _filters.push({ column: col, op: '=',    value: val });          return builder },
    neq(col: string, val: any)                { _filters.push({ column: col, op: '!=',   value: val });          return builder },
    ilike(col: string, val: any)              { _filters.push({ column: col, op: 'ilike',value: val });          return builder },
    like(col: string, val: any)               { _filters.push({ column: col, op: 'like', value: val });          return builder },
    gt(col: string, val: any)                 { _filters.push({ column: col, op: '>',    value: val });          return builder },
    gte(col: string, val: any)                { _filters.push({ column: col, op: '>=',   value: val });          return builder },
    lt(col: string, val: any)                 { _filters.push({ column: col, op: '<',    value: val });          return builder },
    lte(col: string, val: any)                { _filters.push({ column: col, op: '<=',   value: val });          return builder },
    in(col: string, vals: any[])              { _filters.push({ column: col, op: 'in',   value: vals });         return builder },
    is(col: string, val: any)                 { _filters.push({ column: col, op: 'is',   value: val });          return builder },
    not(col: string, op: string, val: any)    { _filters.push({ column: col, op: `not.${op}`, value: val });     return builder },
    contains(col: string, val: any)           { _filters.push({ column: col, op: '@>',   value: val });          return builder },
    order(col: string, opts?: { ascending?: boolean }) { _orders.push({ column: col, ascending: opts?.ascending ?? true }); return builder },
    limit(n: number)                          { _limit = n;                                                       return builder },
    range(from: number, to: number)           { _offset = from; _limit = to - from + 1;                          return builder },
    single()                                  { _single = true; _limit = 1;                                       return _executeSelect() },
    maybeSingle()                             { _maybeSingle = true; _limit = 1;                                  return _executeSelect() },

    // Mutations — return a thenable object that also supports .select() chaining
    insert(data: any | any[]) { return makeMutationBuilder(apiBase, 'insert', table, data, _filters) },
    update(data: any)         { return makeMutationBuilder(apiBase, 'update', table, data, _filters) },
    upsert(data: any | any[], opts?: any) { return makeMutationBuilder(apiBase, 'upsert', table, data, _filters, opts) },
    delete()                  { return makeMutationBuilder(apiBase, 'delete', table, null, _filters) },

    then(resolve: (v: any) => any, reject?: (e: any) => any) {
      return _executeSelect().then(resolve, reject)
    },
  }

  return builder
}

// ---------------------------------------------------------------------------
// Mutation builder (INSERT / UPDATE / UPSERT / DELETE) — supports .select()
// ---------------------------------------------------------------------------
function makeMutationBuilder(apiBase: string, op: string, table: string, data: any, initialFilters: FilterOp[], opts?: any) {
  // Mutation builders can also have filters (e.g. .update().eq().select())
  const _filters: FilterOp[] = [...initialFilters]

  async function _executeMutation() {
    const payload = { op, table, data, filters: _filters, opts }
    try {
      const res  = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) return { data: null, error: json.error ?? { message: json.message } }
      return { data: Array.isArray(json.data) ? json.data : [json.data], error: null }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  }

  const mutation = {
    // Filter methods — allow chaining .eq(), .neq(), etc. before .select()
    eq(col: string, val: any)  { _filters.push({ column: col, op: '=',  value: val }); return mutation },
    neq(col: string, val: any) { _filters.push({ column: col, op: '!=', value: val }); return mutation },
    in(col: string, vals: any[]) { _filters.push({ column: col, op: 'in', value: vals }); return mutation },

    // .select() executes the mutation and returns a promise (RETURNING * is always used)
    select(_cols = '*') { return _executeMutation() },

    // .single() returns the first row
    single() {
      return _executeMutation().then(res => {
        if (res.error) return res
        const rows = Array.isArray(res.data) ? res.data : [res.data]
        return { data: rows[0] ?? null, error: rows.length === 0 ? { message: 'No rows returned' } : null }
      })
    },

    then(resolve: (v: any) => any, reject?: (e: any) => any) {
      return _executeMutation().then(resolve, reject)
    },
  }

  return mutation
}
