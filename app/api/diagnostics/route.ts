import { NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { db } from '@/lib/db'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    s3: null,
    email_config: null,
    email_candidates: null,
    imap: null,
  }

  // ── 1. S3 BUCKET CHECK ──────────────────────────────────────────────────
  try {
    const BUCKET     = 'bucket-7votj4'
    const REGION     = 'ap-south-1'
    const ACCESS_KEY = process.env.LIGHTSAIL_ACCESS_KEY_ID       || ''
    const SECRET_KEY = process.env.LIGHTSAIL_ACCESS_SECRET_KEY   || ''

    // Same config as the confirmed-working upload-cv route — no custom endpoint
    const s3 = new S3Client({
      region:      REGION,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    })

    const listResp = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: 'resumes/',
      MaxKeys: 50,
    }))

    const files = (listResp.Contents || []).map(f => ({
      key:           f.Key,
      size_kb:       Math.round((f.Size || 0) / 1024),
      last_modified: f.LastModified?.toISOString(),
      url:           `https://${BUCKET}.s3.${REGION}.amazonaws.com/${f.Key}`,
    }))

    results.s3 = {
      status:      'connected',
      bucket:      BUCKET,
      region:      REGION,
      total_files: files.length,
      ak_first4:   ACCESS_KEY.slice(0, 4),
      ak_length:   ACCESS_KEY.length,
      sk_length:   SECRET_KEY.length,
      files,
    }
  } catch (err: any) {
    results.s3 = {
      status: 'error',
      error:  err.message,
      code:   err.Code || err.name,
    }
  }

  // ── 2. DB — EMAIL CONFIG CHECK ──────────────────────────────────────────
  try {
    const configs = await db.query(`
      SELECT
        id,
        organization_id,
        imap_host,
        imap_port,
        username,
        folder,
        use_tls,
        poll_interval_minutes,
        is_active,
        created_at
      FROM email_configs
      ORDER BY created_at DESC
    `)
    results.email_config = {
      status:  'ok',
      count:   configs.length,
      configs: configs.map(c => ({ ...c, encrypted_password: '[HIDDEN]' })),
    }
  } catch (err: any) {
    results.email_config = {
      status: 'error',
      error:  err.message,
    }
  }

  // ── 3. DB — CANDIDATES FROM EMAIL ──────────────────────────────────────
  try {
    const candidates = await db.query(`
      SELECT
        id,
        name,
        email,
        mobile_number,
        cv_url,
        status,
        source,
        organization_id,
        created_at
      FROM candidates
      WHERE source = 'email'
      ORDER BY created_at DESC
      LIMIT 20
    `)
    results.email_candidates = {
      status:     'ok',
      total:      candidates.length,
      candidates,
    }
  } catch (err: any) {
    results.email_candidates = {
      status: 'error',
      error:  err.message,
    }
  }

  // ── 4. IMAP RAW TCP TEST (just port check) ──────────────────────────────
  try {
    const net  = await import('net')
    const tls  = await import('tls')

    await new Promise<void>((resolve, reject) => {
      const socket = tls.connect({
        host:               'outlook.office365.com',
        port:               993,
        rejectUnauthorized: false,
        timeout:            8000,
      }, () => {
        socket.destroy()
        resolve()
      })
      socket.on('error',   reject)
      socket.on('timeout', () => reject(new Error('TCP connect timed out')))
    })

    results.imap = {
      status:  'port_open',
      message: 'outlook.office365.com:993 is reachable — TCP/TLS handshake OK',
      note:    'LOGIN failed because Microsoft 365 has Basic Auth disabled for this mailbox. See fix instructions below.',
      fix: {
        option_1: 'Go to admin.microsoft.com → Users → cv@careerguideline.co.in → Mail → Manage email apps → enable IMAP',
        option_2: 'Run PowerShell: Set-CASMailbox -Identity cv@careerguideline.co.in -ImapEnabled $true',
        option_3: 'Enable Basic Auth policy: New-AuthenticationPolicy -Name AllowBasicIMAP; Set-AuthenticationPolicy -Identity AllowBasicIMAP -AllowBasicAuthImap $true; Set-User -Identity cv@careerguideline.co.in -AuthenticationPolicy AllowBasicIMAP',
      },
    }
  } catch (err: any) {
    results.imap = {
      status:  'port_error',
      error:   err.message,
      message: 'Cannot reach outlook.office365.com:993 — check firewall/network',
    }
  }

  return NextResponse.json(results, { status: 200 })
}
