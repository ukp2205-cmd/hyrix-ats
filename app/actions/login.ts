'use server'

import db from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

interface LoginResult {
  success: boolean
  message?: string
  user?: { email: string; name: string; role: string }
}

export async function authenticateUser(email: string, password: string): Promise<LoginResult> {
  try {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      return { success: false, message: 'Please enter both email and password' }
    }

    // 1. Check organization table (super_admin / admin owners)
    const orgUser = await db.queryOne<any>(
      `SELECT id, name, email, password_hash FROM organization WHERE LOWER(email) = $1 LIMIT 1`,
      [trimmedEmail]
    )

    if (orgUser?.password_hash) {
      const match = await bcrypt.compare(trimmedPassword, orgUser.password_hash)
      if (match) {
        await setSessionCookie({ email: orgUser.email, name: orgUser.name, role: 'super_admin', id: orgUser.id })
        return { success: true, user: { email: orgUser.email, name: orgUser.name, role: 'super_admin' } }
      }
    }

    // 2. Check org_team table (recruiters, hiring managers, etc.)
    const teamUser = await db.queryOne<any>(
      `SELECT id, name, email, role, password, organization_id FROM org_team WHERE LOWER(email) = $1 AND status = 'active' LIMIT 1`,
      [trimmedEmail]
    )

    if (teamUser?.password) {
      const isHashed = teamUser.password.startsWith('$2')
      const match = isHashed
        ? await bcrypt.compare(trimmedPassword, teamUser.password)
        : teamUser.password === trimmedPassword
      if (match) {
        await setSessionCookie({ email: teamUser.email, name: teamUser.name, role: teamUser.role || 'recruiter', id: teamUser.id, organizationId: teamUser.organization_id })
        return { success: true, user: { email: teamUser.email, name: teamUser.name, role: teamUser.role || 'recruiter' } }
      }
    }

    return { success: false, message: 'Invalid email or password. Please check your credentials.' }
  } catch (error: any) {
    console.error('[v0] Login error:', error)
    return { success: false, message: 'An error occurred during login. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Write an HTTP-only session cookie (base64-encoded JSON)
// ---------------------------------------------------------------------------
async function setSessionCookie(payload: Record<string, any>) {
  const cookieStore = await cookies()
  const data = Buffer.from(JSON.stringify({ ...payload, loginTime: Date.now(), expiresIn: 24 * 60 * 60 * 1000 })).toString('base64')
  cookieStore.set('hyrix_session', data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}
