'use server'

import db from '@/lib/db'
import bcrypt from 'bcryptjs'

export interface RegisterData {
  name: string
  email: string
  mobile_number: string
  password: string
}

export interface RegisterResult {
  success: boolean
  message: string
  organizationId?: string
  error?: string
}

export async function registerAdmin(data: RegisterData): Promise<RegisterResult> {
  try {
    const existing = await db.queryOne<any>(
      `SELECT id FROM organization WHERE LOWER(email) = $1 LIMIT 1`,
      [data.email.toLowerCase()]
    )
    if (existing) {
      return { success: false, message: 'An account with this email already exists', error: 'EMAIL_EXISTS' }
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const [org] = await db.query<any>(
      `INSERT INTO organization (name, email, mobile_number, password_hash, role, status, registration_date)
       VALUES ($1, $2, $3, $4, 'admin', 'active', NOW()) RETURNING *`,
      [data.name, data.email, data.mobile_number, passwordHash]
    )

    if (!org) {
      return { success: false, message: 'Failed to create organisation. Please try again.' }
    }

    // Also insert into org_team so they appear as a team member
    await db.execute(
      `INSERT INTO org_team (organization_id, name, email, phone, role, status, is_admin, joined_date)
       VALUES ($1, $2, $3, $4, 'admin', 'active', true, NOW())`,
      [org.id, data.name, data.email, data.mobile_number]
    )

    return { success: true, message: 'Registration successful! You can now log in.', organizationId: org.id }
  } catch (error: any) {
    console.error('[v0] Registration error:', error)
    return { success: false, message: 'An unexpected error occurred. Please try again.', error: error.message }
  }
}
