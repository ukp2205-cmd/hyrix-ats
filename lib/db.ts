import { Pool } from 'pg'

// Lazy pool — created on first use so it always reads the current env vars
// This prevents stale config when env vars are updated without a full cold restart
let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    const dbName = process.env.LIGHTSAIL_DB_NAME
    const host   = process.env.LIGHTSAIL_DB_HOST
    const user   = process.env.LIGHTSAIL_DB_USER
    const port   = Number(process.env.LIGHTSAIL_DB_PORT) || 5432

    _pool = new Pool({
      host,
      port,
      user,
      password: process.env.LIGHTSAIL_DB_PASSWORD,
      database: dbName,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })

    _pool.on('error', (err) => {
      console.error('[v0] Unexpected DB pool error:', err)
      // Reset pool on fatal errors so the next query creates a fresh one
      _pool = null
    })
  }
  return _pool
}

// ---------------------------------------------------------------------------
// Helper: run a parameterised query and return rows
// Usage: db.query('SELECT * FROM candidates WHERE id = $1', [id])
// ---------------------------------------------------------------------------
export const db = {
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await getPool().connect()
    try {
      const result = await client.query(text, params)
      return result.rows as T[]
    } finally {
      client.release()
    }
  },

  // Returns a single row or null
  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await db.query<T>(text, params)
    return rows[0] ?? null
  },

  // Returns row count affected
  async execute(text: string, params?: any[]): Promise<number> {
    const client = await getPool().connect()
    try {
      const result = await client.query(text, params)
      return result.rowCount ?? 0
    } finally {
      client.release()
    }
  },

  // Expose pool accessor for transactions
  get pool() { return getPool() },
}

export default db
