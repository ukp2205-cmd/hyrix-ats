import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'hyrix-secret-key'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('hyrix_token')?.value
    if (!token) return NextResponse.json({ user: null })

    const user = jwt.verify(token, JWT_SECRET) as any
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null })
  }
}
