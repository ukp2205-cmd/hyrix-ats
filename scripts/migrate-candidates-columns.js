import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  host:     process.env.LIGHTSAIL_DB_HOST,
  port:     Number(process.env.LIGHTSAIL_DB_PORT) || 5432,
  user:     process.env.LIGHTSAIL_DB_USER,
  password: process.env.LIGHTSAIL_DB_PASSWORD,
  database: process.env.LIGHTSAIL_DB_NAME,
  ssl:      { rejectUnauthorized: false },
})

const migrations = [
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS created_by UUID`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_ids UUID[]`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS designation TEXT`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS area TEXT`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS source TEXT`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS quality TEXT`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS buyout_available TEXT`,
  `ALTER TABLE candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
]

const client = await pool.connect()
try {
  for (const sql of migrations) {
    try {
      await client.query(sql)
      console.log('OK:', sql.substring(0, 60))
    } catch (e) {
      console.log('SKIP (already exists?):', e.message)
    }
  }
  console.log('Migration complete!')
} finally {
  client.release()
  await pool.end()
}
