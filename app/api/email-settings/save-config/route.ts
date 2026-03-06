import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// ENV: ENCRYPTION_KEY — 32-byte hex string (generate: openssl rand -hex 32)
const ALGORITHM = 'aes-256-cbc'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || ''
  // If it looks like a 64-char hex string (openssl rand -hex 32), decode as hex → 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex')
  }
  // Otherwise treat as UTF-8, pad/truncate to 32 bytes
  return Buffer.from(raw.slice(0, 32).padEnd(32, '0'), 'utf8')
}

function encrypt(text: string): string {
  const iv        = crypto.randomBytes(16)
  const cipher    = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

// POST — save / upsert config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { organizationId, imapHost, imapPort, username, password, folder, useTls, pollInterval } = body
    console.log('[SAVE-CONFIG] POST received — orgId:', organizationId, '| host:', imapHost, '| user:', username, '| passwordLen:', password?.length, '| ENCRYPTION_KEY set:', !!(process.env.ENCRYPTION_KEY))

    if (!organizationId) return NextResponse.json({ error: 'Organization ID is required.' }, { status: 400 })
    if (!imapHost)       return NextResponse.json({ error: 'IMAP host is required.' },      { status: 400 })
    if (!username)       return NextResponse.json({ error: 'Email / username is required.' },{ status: 400 })
    if (!password)       return NextResponse.json({ error: 'Password is required.' },        { status: 400 })

    const encryptedPassword = encrypt(password)

    await db.execute(`
      INSERT INTO email_configs
        (organization_id, imap_host, imap_port, username, encrypted_password, folder, use_tls, poll_interval_minutes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      ON CONFLICT (organization_id) DO UPDATE SET
        imap_host             = EXCLUDED.imap_host,
        imap_port             = EXCLUDED.imap_port,
        username              = EXCLUDED.username,
        encrypted_password    = EXCLUDED.encrypted_password,
        folder                = EXCLUDED.folder,
        use_tls               = EXCLUDED.use_tls,
        poll_interval_minutes = EXCLUDED.poll_interval_minutes,
        is_active             = TRUE,
        updated_at            = NOW()
    `, [
      organizationId,
      imapHost,
      Number(imapPort) || 993,
      username,
      encryptedPassword,
      folder || 'INBOX',
      useTls !== false,
      Number(pollInterval) || 5,
    ])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[EMAIL CONFIG] save error:', err.message)
    if (err.message?.includes('does not exist') || err.message?.includes('42P01')) {
      return NextResponse.json({
        error: 'Database table not set up yet. Please visit /api/migrations/email-configs first.'
      }, { status: 500 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET — load existing config (no password returned)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    if (!organizationId) return NextResponse.json({ config: null })

    const config = await db.queryOne<any>(
      `SELECT imap_host, imap_port, username, folder, use_tls, poll_interval_minutes
       FROM email_configs WHERE organization_id = $1`,
      [organizationId]
    )

    return NextResponse.json({ config: config || null })
  } catch (err: any) {
    console.error('[EMAIL CONFIG] load error:', err.message)
    // Table not created yet — return null config gracefully instead of 500
    if (err.message?.includes('does not exist') || err.message?.includes('42P01')) {
      return NextResponse.json({ config: null })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
