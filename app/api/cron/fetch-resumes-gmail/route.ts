import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const BUCKET = 'bucket-7votj4'
const REGION = 'ap-south-1'

function getS3() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId:     process.env.LIGHTSAIL_ACCESS_KEY_ID     || '',
      secretAccessKey: process.env.LIGHTSAIL_ACCESS_SECRET_KEY || '',
    },
  })
}

async function refreshAccessToken(conn: any): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID     || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: conn.refresh_token,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(`Token refresh failed: ${data.error_description || data.error}`)

  const expiry = new Date(Date.now() + (data.expires_in || 3600) * 1000)
  await db.execute(
    `UPDATE google_connections SET access_token = $1, expiry_date = $2, updated_at = NOW() WHERE id = $3`,
    [data.access_token, expiry, conn.id]
  )
  return data.access_token
}

async function getValidToken(conn: any): Promise<string> {
  const now    = new Date()
  const expiry = new Date(conn.expiry_date)
  // Refresh if token expires within 5 minutes
  if (expiry <= new Date(now.getTime() + 5 * 60 * 1000)) {
    console.log('[GMAIL CRON] Token expired/expiring — refreshing for:', conn.email)
    return await refreshAccessToken(conn)
  }
  return conn.access_token
}

async function fetchGmailResumes(conn: any): Promise<number> {
  const token = await getValidToken(conn)
  let processed = 0

  // Search for unread emails with attachments
  const searchRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+has:attachment&maxResults=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const searchData = await searchRes.json()
  if (!searchData.messages?.length) {
    console.log('[GMAIL CRON] No unread emails with attachments for:', conn.email)
    return 0
  }

  console.log('[GMAIL CRON] Found', searchData.messages.length, 'messages for:', conn.email)

  for (const msg of searchData.messages) {
    try {
      // Get full message
      const msgRes  = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const msgData = await msgRes.json()

      // Extract sender info from headers
      const headers    = msgData.payload?.headers || []
      const fromHeader = headers.find((h: any) => h.name === 'From')?.value || ''
      const fromMatch  = fromHeader.match(/^(?:"?([^"<]+)"?\s*)?<?([^>]+@[^>]+)>?$/)
      const senderName  = fromMatch?.[1]?.trim() || fromHeader.split('@')[0] || 'Applicant'
      const senderEmail = fromMatch?.[2]?.trim() || ''

      // Find resume attachments recursively in MIME parts
      const resumeParts: any[] = []
      const findAttachments = (parts: any[]) => {
        for (const part of parts || []) {
          if (part.parts) findAttachments(part.parts)
          if (part.filename && /\.(pdf|doc|docx)$/i.test(part.filename) && part.body?.attachmentId) {
            resumeParts.push(part)
          }
        }
      }
      findAttachments(msgData.payload?.parts || [])

      console.log('[GMAIL CRON] Email from:', senderEmail, '| resume parts:', resumeParts.length)
      if (!resumeParts.length) continue

      for (const part of resumeParts) {
        // Download attachment bytes
        const attRes  = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${part.body.attachmentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const attData = await attRes.json()
        // Gmail returns base64url encoded data
        const buffer  = Buffer.from(attData.data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

        // Upload to Lightsail S3
        const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
        const key      = `resumes/${conn.organization_id}/${Date.now()}-${safeName}`
        await getS3().send(new PutObjectCommand({
          Bucket:      BUCKET,
          Key:         key,
          Body:        buffer,
          ContentType: part.mimeType || 'application/octet-stream',
        }))
        const cvUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
        console.log('[GMAIL CRON] Uploaded to S3:', cvUrl)

        // Check if candidate already exists
        const existing = await db.queryOne<{ id: string }>(
          `SELECT id FROM candidates WHERE email = $1 AND organization_id = $2 LIMIT 1`,
          [senderEmail, conn.organization_id]
        )
        if (existing) {
          await db.execute(`UPDATE candidates SET cv_url = $1 WHERE id = $2`, [cvUrl, existing.id])
          console.log('[GMAIL CRON] Updated existing candidate:', senderEmail)
        } else {
          await db.execute(`
            INSERT INTO candidates
              (id, name, email, mobile_number, cv_url, status, source, organization_id, created_at)
            VALUES (gen_random_uuid(), $1, $2, '', $3, 'Applied', 'email', $4, NOW())
          `, [senderName, senderEmail, cvUrl, conn.organization_id])
          console.log('[GMAIL CRON] Created new candidate:', senderName, senderEmail)
        }
        processed++
      }

      // Mark email as read
      await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
      })
    } catch (msgErr: any) {
      console.error('[GMAIL CRON] Error on message', msg.id, ':', msgErr.message)
    }
  }
  return processed
}

export async function GET() {
  try {
    const connections = await db.query<any>(
      `SELECT * FROM google_connections WHERE is_active = true`
    )
    console.log('[GMAIL CRON] Active Gmail connections:', connections.length)

    let totalProcessed = 0
    for (const conn of connections) {
      try {
        const count = await fetchGmailResumes(conn)
        totalProcessed += count
      } catch (err: any) {
        console.error('[GMAIL CRON] Failed for', conn.email, ':', err.message)
      }
    }
    return NextResponse.json({ success: true, processed: totalProcessed, connections: connections.length })
  } catch (err: any) {
    console.error('[GMAIL CRON] Fatal error:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
