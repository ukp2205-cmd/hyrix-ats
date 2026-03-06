import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { db } from '@/lib/db'

// Hardcoded Microsoft 365 credentials for cv@careerguideline.co.in
const IMAP_CONFIG = {
  host:     'outlook.office365.com',
  port:     993,
  tls:      true,
  user:     'cv@careerguideline.co.in',
  password: 'C*590233188056ug',
  folder:   'INBOX',
}

const S3_BUCKET = 'bucket-7votj4'
const S3_REGION = 'ap-south-1'

function getS3() {
  return new S3Client({
    region:      S3_REGION,
    credentials: {
      accessKeyId:     process.env.LIGHTSAIL_ACCESS_KEY_ID     || '',
      secretAccessKey: process.env.LIGHTSAIL_ACCESS_SECRET_KEY || '',
    },
  })
}

export const maxDuration = 60

export async function GET() {
  const log: string[] = []
  const push = (msg: string) => { console.log('[IMAP-TEST]', msg); log.push(msg) }

  push('Starting IMAP fetch test')
  push(`Host: ${IMAP_CONFIG.host}:${IMAP_CONFIG.port} | User: ${IMAP_CONFIG.user}`)

  let Imap: any
  try {
    const mod = await import('node-imap')
    Imap = mod.default || mod
    push('node-imap loaded OK')
  } catch (e: any) {
    push('FAILED to load node-imap: ' + e.message)
    return NextResponse.json({ success: false, log, error: 'node-imap not available: ' + e.message })
  }

  let simpleParser: any
  try {
    const mod = await import('mailparser')
    simpleParser = mod.simpleParser
    push('mailparser loaded OK')
  } catch (e: any) {
    push('FAILED to load mailparser: ' + e.message)
    return NextResponse.json({ success: false, log, error: 'mailparser not available: ' + e.message })
  }

  return new Promise<NextResponse>((resolve) => {
    const imap = new Imap({
      user:        IMAP_CONFIG.user,
      password:    IMAP_CONFIG.password,
      host:        IMAP_CONFIG.host,
      port:        IMAP_CONFIG.port,
      tls:         IMAP_CONFIG.tls,
      tlsOptions:  { rejectUnauthorized: false },
      connTimeout: 30000,
      authTimeout: 20000,
    })

    const results: Array<{ name: string; email: string; file: string; s3url: string }> = []

    imap.once('ready', () => {
      push('IMAP connected and authenticated successfully')

      imap.openBox(IMAP_CONFIG.folder, false, (boxErr: Error, box: any) => {
        if (boxErr) {
          push('openBox error: ' + boxErr.message)
          imap.end()
          return resolve(NextResponse.json({ success: false, log, error: boxErr.message }))
        }

        push(`Mailbox opened: ${IMAP_CONFIG.folder} | Total messages: ${box.messages.total}`)

        // Search ALL unseen
        imap.search(['UNSEEN'], (searchErr: Error, uids: number[]) => {
          if (searchErr) {
            push('search error: ' + searchErr.message)
            imap.end()
            return resolve(NextResponse.json({ success: false, log, error: searchErr.message }))
          }

          push(`Unseen UIDs found: ${JSON.stringify(uids)}`)

          if (!uids || uids.length === 0) {
            push('No unseen emails. Mark the test email as unread in Outlook and try again.')
            imap.end()
            return resolve(NextResponse.json({ success: false, log, message: 'No unseen emails found. Mark the test email as UNREAD first.' }))
          }

          const pendingTasks: Promise<void>[] = []

          const f = imap.fetch(uids, { bodies: '', markSeen: true })

          f.on('message', (msg: any, seqno: number) => {
            push(`Processing message seqno: ${seqno}`)
            const chunks: Buffer[] = []

            const task = new Promise<void>((done) => {
              msg.on('body', (stream: any) => {
                stream.on('data', (chunk: Buffer) => chunks.push(chunk))
                stream.on('end', async () => {
                  try {
                    const raw    = Buffer.concat(chunks)
                    const parsed = await simpleParser(raw)

                    const senderName  = parsed.from?.value?.[0]?.name || parsed.from?.text || 'Applicant'
                    const senderEmail = (parsed.from?.value?.[0]?.address || '').toLowerCase()
                    const subject     = parsed.subject || '(no subject)'

                    push(`Email from: ${senderEmail} | Subject: ${subject}`)

                    const attachments: any[] = (parsed.attachments || []).filter((a: any) =>
                      /\.(pdf|doc|docx)$/i.test(a.filename || '')
                    )
                    push(`Resume attachments: ${attachments.length}`)

                    for (const att of attachments) {
                      const safeName = att.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
                      const key      = `resumes/email-test/${Date.now()}-${safeName}`
                      push(`Uploading to S3: ${key}`)

                      try {
                        await getS3().send(new PutObjectCommand({
                          Bucket:      S3_BUCKET,
                          Key:         key,
                          Body:        att.content as Buffer,
                          ContentType: att.contentType || 'application/octet-stream',
                        }))

                        const s3url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`
                        push(`S3 upload SUCCESS: ${s3url}`)

                        // Check if candidate already exists (no unique constraint on email, so check manually)
                        const orgId = '3b44102c-4606-48d3-b0c3-d174e920bd8b'
                        const existing = await db.queryOne<{ id: string }>(
                          `SELECT id FROM candidates WHERE email = $1 AND organization_id = $2 LIMIT 1`,
                          [senderEmail, orgId]
                        )
                        if (existing) {
                          await db.execute(
                            `UPDATE candidates SET cv_url = $1 WHERE id = $2`,
                            [s3url, existing.id]
                          )
                          push(`Candidate already exists — updated CV URL for: ${senderEmail}`)
                        } else {
                          await db.execute(`
                            INSERT INTO candidates
                              (id, name, email, mobile_number, cv_url, status, source, organization_id, created_at)
                            VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Applied', 'email', $5, NOW())
                          `, [senderName, senderEmail, '', s3url, orgId])
                          push(`New candidate inserted: ${senderName} <${senderEmail}>`)
                        }

                        push(`Candidate saved to DB: ${senderName} <${senderEmail}>`)
                        results.push({ name: senderName, email: senderEmail, file: att.filename, s3url })
                      } catch (s3Err: any) {
                        push(`S3/DB error: ${s3Err.message}`)
                      }
                    }
                  } catch (parseErr: any) {
                    push(`Parse error: ${parseErr.message}`)
                  }
                  done()
                })
              })
            })
            pendingTasks.push(task)
          })

          f.on('error', (fetchErr: Error) => {
            push('fetch stream error: ' + fetchErr.message)
          })

          f.on('end', async () => {
            push('All messages fetched, waiting for parsing...')
            await Promise.all(pendingTasks)
            push(`Done. Processed ${results.length} resume(s).`)
            imap.end()
          })
        })
      })
    })

    imap.once('error', (err: Error) => {
      push('IMAP error: ' + err.message)
      resolve(NextResponse.json({ success: false, log, error: err.message }))
    })

    imap.once('end', () => {
      resolve(NextResponse.json({
        success: results.length > 0,
        processed: results.length,
        log,
        results,
      }))
    })

    push('Connecting to IMAP...')
    try {
      imap.connect()
    } catch (e: any) {
      push('connect() threw: ' + e.message)
      resolve(NextResponse.json({ success: false, log, error: e.message }))
    }
  })
}
