import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

export const maxDuration = 60

const ALGORITHM = 'aes-256-cbc'
const BUCKET    = process.env.LIGHTSAIL_STORAGE_BUCKET_NAME || 'bucket-7votj4'
const REGION    = process.env.LIGHTSAIL_STORAGE_REGION      || 'ap-south-1'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || ''
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex')
  return Buffer.from(raw.slice(0, 32).padEnd(32, '0'), 'utf8')
}

function decrypt(encryptedText: string): string {
  try {
    const [ivHex, dataHex] = encryptedText.split(':')
    if (!ivHex || !dataHex) return encryptedText
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'))
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8')
  } catch { return encryptedText }
}

function getS3(): S3Client {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId:     process.env.LIGHTSAIL_ACCESS_KEY_ID     || '',
      secretAccessKey: process.env.LIGHTSAIL_ACCESS_SECRET_KEY || '',
    },
  })
}

function parsePhone(text: string): string {
  const m = text.match(/(\+?[\d\s\-().]{10,15})/)
  return m ? m[1].trim().slice(0, 20) : ''
}

// ── node-imap based fetcher ───────────────────────────────────────────────────
interface EmailResult {
  senderName:  string
  senderEmail: string
  phone:       string
  filename:    string
  content:     Buffer
  contentType: string
}

function fetchWithNodeImap(config: any, password: string): Promise<EmailResult[]> {
  return new Promise(async (resolve, reject) => {

    // dynamic imports
    let Imap: any, simpleParser: any
    try { Imap = (await import('node-imap')).default } catch (e: any) { return reject(new Error('node-imap unavailable: ' + e.message)) }
    try { simpleParser = (await import('mailparser')).simpleParser } catch (e: any) { return reject(new Error('mailparser unavailable: ' + e.message)) }

    const imap = new Imap({
      user:        config.username,
      password,
      host:        config.imap_host,
      port:        Number(config.imap_port) || 993,
      tls:         config.use_tls !== false,
      tlsOptions:  { rejectUnauthorized: false },
      connTimeout: 20000,
      authTimeout: 15000,
    })

    const results: EmailResult[] = []

    imap.once('ready', () => {
      console.log('[EMAIL CRON] IMAP ready, opening box:', config.folder || 'INBOX')

      imap.openBox(config.folder || 'INBOX', false, (boxErr: Error) => {
        if (boxErr) {
          console.error('[EMAIL CRON] openBox error:', boxErr.message)
          imap.end()
          return reject(boxErr)
        }

        // Search ALL unseen messages
        imap.search(['UNSEEN'], (searchErr: Error, uids: number[]) => {
          if (searchErr) {
            console.error('[EMAIL CRON] Search error:', searchErr.message)
            imap.end()
            return resolve([])
          }

          console.log('[EMAIL CRON] Unseen UIDs:', uids)

          if (!uids || uids.length === 0) {
            console.log('[EMAIL CRON] No unseen emails found.')
            imap.end()
            return resolve([])
          }

          const pendingParses: Promise<void>[] = []
          const f = imap.fetch(uids, { bodies: '', markSeen: true })

          f.on('message', (msg: any) => {
            const chunks: Buffer[] = []

            const p = new Promise<void>((done) => {
              msg.on('body', (stream: any) => {
                stream.on('data',  (chunk: Buffer) => chunks.push(chunk))
                stream.on('error', (e: Error) => { console.error('[EMAIL CRON] stream error:', e.message); done() })
                stream.on('end',   async () => {
                  try {
                    const raw    = Buffer.concat(chunks)
                    const parsed = await simpleParser(raw)

                    const senderName  = parsed.from?.value?.[0]?.name || parsed.from?.text || 'Applicant'
                    const senderEmail = (parsed.from?.value?.[0]?.address || '').toLowerCase()
                    const phone       = parsePhone(parsed.text || '')

                    const attachments: any[] = (parsed.attachments || []).filter((a: any) =>
                      /\.(pdf|doc|docx)$/i.test(a.filename || '')
                    )
                    console.log('[EMAIL CRON] From:', senderEmail, '| resume attachments:', attachments.length)

                    for (const att of attachments) {
                      results.push({
                        senderName,
                        senderEmail,
                        phone,
                        filename:    att.filename || 'resume.pdf',
                        content:     att.content as Buffer,
                        contentType: att.contentType || 'application/octet-stream',
                      })
                    }
                  } catch (parseErr: any) {
                    console.error('[EMAIL CRON] parse error:', parseErr.message)
                  }
                  done()
                })
              })
            })
            pendingParses.push(p)
          })

          f.on('error', (fetchErr: Error) => {
            console.error('[EMAIL CRON] fetch error:', fetchErr.message)
          })

          f.on('end', async () => {
            await Promise.all(pendingParses)
            console.log('[EMAIL CRON] All messages processed. Results:', results.length)
            imap.end()
          })
        })
      })
    })

    imap.once('error', (err: Error) => {
      console.error('[EMAIL CRON] IMAP error:', err.message)
      reject(err)
    })

    imap.once('end', () => {
      resolve(results)
    })

    imap.connect()
  })
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  console.log('[EMAIL CRON] Job started at', new Date().toISOString())

  try {
    let configs: any[] = []
    try {
      configs = await db.query<any>('SELECT * FROM email_configs WHERE is_active = TRUE')
    } catch (e: any) {
      if (e.message?.includes('does not exist') || e.message?.includes('42P01')) {
        return NextResponse.json({ success: false, error: 'email_configs table not created yet. Visit /api/migrations/email-configs first.' })
      }
      throw e
    }

    console.log('[EMAIL CRON] Active configs:', configs.length)
    if (!configs.length) {
      return NextResponse.json({ success: true, processed: 0, configs: 0, message: 'No active email configs.' })
    }

    let totalProcessed = 0

    for (const config of configs) {
      console.log('[EMAIL CRON] Processing org:', config.organization_id, 'host:', config.imap_host)
      try {
        const password = decrypt(config.encrypted_password)
        const emails   = await fetchWithNodeImap(config, password)

        for (const em of emails) {
          try {
            const safeName = em.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
            const key      = `resumes/${config.organization_id}/${Date.now()}-${safeName}`

            await getS3().send(new PutObjectCommand({
              Bucket:      BUCKET,
              Key:         key,
              Body:        em.content,
              ContentType: em.contentType,
            }))

            const cvUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`

            await db.execute(`
              INSERT INTO candidates
                (id, name, email, mobile_number, cv_url, status, source, organization_id, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Applied', 'email', $5, NOW(), NOW())
              ON CONFLICT (email)
              DO UPDATE SET cv_url = EXCLUDED.cv_url, updated_at = NOW()
            `, [em.senderName, em.senderEmail, em.phone, cvUrl, config.organization_id])

            totalProcessed++
            console.log('[EMAIL CRON] Candidate saved:', em.senderName, em.senderEmail)
          } catch (saveErr: any) {
            console.error('[EMAIL CRON] Save error:', saveErr.message)
          }
        }
      } catch (configErr: any) {
        console.error('[EMAIL CRON] Error for org', config.organization_id, ':', configErr.message)
      }
    }

    console.log('[EMAIL CRON] Done. Total processed:', totalProcessed)
    return NextResponse.json({ success: true, processed: totalProcessed, configs: configs.length })
  } catch (err: any) {
    console.error('[EMAIL CRON] Fatal:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
