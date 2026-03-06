import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Creates any tables that may be missing from the Lightsail Postgres DB.
// Safe to call multiple times — all statements use IF NOT EXISTS.
export async function GET() {
  try {
    // ── designations ────────────────────────────────────────────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS designations (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT        NOT NULL,
        organization_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS designations_name_global_idx ON designations (LOWER(name)) WHERE organization_id IS NULL`)

    // Seed common designations
    const seeds = [
      'Software Engineer','Senior Software Engineer','Lead Engineer','Engineering Manager',
      'Product Manager','Senior Product Manager','Data Analyst','Data Scientist',
      'ML Engineer','DevOps Engineer','QA Engineer','UI/UX Designer','Business Analyst',
      'Project Manager','Scrum Master','Sales Executive','Sales Manager','Marketing Executive',
      'HR Executive','HR Manager','Talent Acquisition Specialist','Finance Analyst',
      'Operations Executive','Operations Manager','Customer Success Manager','Account Manager',
      'Full Stack Developer','Frontend Developer','Backend Developer','Mobile Developer',
      'Android Developer','iOS Developer','React Developer','Node.js Developer',
      'Technical Lead','Architect','CTO','CEO','COO','CFO','VP Engineering','VP Sales',
      'Customer Support Executive','Team Lead','Recruiter','Content Manager','Scrum Master',
    ]
    for (const name of seeds) {
      await db.execute(
        `INSERT INTO designations (name) VALUES ($1) ON CONFLICT DO NOTHING`,
        [name]
      )
    }

    // ── skills (if missing) ──────────────────────────────────────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS skills (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        skill_name TEXT NOT NULL UNIQUE,
        category   TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // ── cities (if missing) ──────────────────────────────────────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cities (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT NOT NULL UNIQUE,
        state      TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // ── industries (if missing) ──────────────────────────────────────────────
    await db.execute(`
      CREATE TABLE IF NOT EXISTS industries (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    return NextResponse.json({ success: true, message: 'All tables ready' })
  } catch (err: any) {
    console.error('[migrate-tables]', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
