/**
 * Migration: add missing columns to candidates table in Lightsail PostgreSQL
 * Run via: node scripts/migrate-candidates-columns.mjs
 * Uses the same DATABASE_URL that lib/db.ts uses.
 */
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
})

const migrations = [
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS created_by UUID`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_ids UUID[] DEFAULT '{}'`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS designation VARCHAR(255)`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS area VARCHAR(255)`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS source VARCHAR(100)`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS quality VARCHAR(50)`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS buyout_available VARCHAR(50)`,
  `CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON candidates(created_by)`,
  `CREATE INDEX IF NOT EXISTS idx_candidates_assigned_to ON candidates(assigned_to)`,
]

async function run() {
  const client = await pool.connect()
  try {
    for (const sql of migrations) {
      console.log('Running:', sql.slice(0, 60))
      await client.query(sql)
      console.log('  OK')
    }
    console.log('\nAll migrations completed successfully.')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
