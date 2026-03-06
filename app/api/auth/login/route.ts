import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

function getPool() {
  return new Pool({
    host:     process.env.LIGHTSAIL_DB_HOST,
    port:     Number(process.env.LIGHTSAIL_DB_PORT) || 5432,
    user:     process.env.LIGHTSAIL_DB_USER,
    password: process.env.LIGHTSAIL_DB_PASSWORD,
    database: process.env.LIGHTSAIL_DB_NAME,
    ssl:      { rejectUnauthorized: false },
    max:      3,
    connectionTimeoutMillis: 10000,
  })
}

const JWT_SECRET = process.env.JWT_SECRET || 'hyrix-secret-key'

export async function POST(req: NextRequest) {
  const pool   = getPool()
  const client = await pool.connect()

  try {
    const body = await req.json()
    const email    = (body.email    || '').trim().toLowerCase()
    const password = (body.password || '').trim()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      )
    }

    // 1. Check organization table (owner = super_admin)
    const orgRes = await client.query(
      'SELECT id, name, email, password_hash FROM organization WHERE LOWER(email) = $1 LIMIT 1',
      [email]
    )

    if (orgRes.rows.length > 0) {
      const user = orgRes.rows[0]

      // Must have a password_hash set — if NULL, deny login (admin must set it manually)
      if (!user.password_hash) {
        return NextResponse.json(
          { success: false, message: 'Account not activated. Please contact support.' },
          { status: 401 }
        )
      }

      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password.' },
          { status: 401 }
        )
      }

      return makeSession({ id: user.id, email: user.email, name: user.name, role: 'super_admin', organizationId: user.id })
    }

    // 2. Check org_team table
    const teamRes = await client.query(
      `SELECT id, name, email, password, role, organization_id
       FROM org_team
       WHERE LOWER(email) = $1 AND status = 'active'
       LIMIT 1`,
      [email]
    )

    if (teamRes.rows.length > 0) {
      const user = teamRes.rows[0]

      if (!user.password) {
        return NextResponse.json(
          { success: false, message: 'Account not activated. Please contact support.' },
          { status: 401 }
        )
      }

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return NextResponse.json(
          { success: false, message: 'Invalid email or password.' },
          { status: 401 }
        )
      }

      return makeSession({ id: user.id, email: user.email, name: user.name, role: user.role || 'recruiter', organizationId: user.organization_id })
    }

    // No user found
    return NextResponse.json(
      { success: false, message: 'Invalid email or password.' },
      { status: 401 }
    )

  } catch (err: any) {
    console.error('[auth/login]', err.message)
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    )
  } finally {
    client.release()
    pool.end()
  }
}

function makeSession(payload: { id: string; email: string; name: string; role: string; organizationId: string }) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })

  const res = NextResponse.json({ success: true, user: payload })

  res.cookies.set('hyrix_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,
    path:     '/',
  })

  return res
}
