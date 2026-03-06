import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imapHost, imapPort, username, password, folder, useTls } = body
    console.log('[TEST-CONNECTION] host:', imapHost, 'port:', imapPort, 'user:', username, 'tls:', useTls)

    if (!imapHost || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields: host, username or password.' }, { status: 400 })
    }

    let Imap: any
    try {
      Imap = (await import('node-imap')).default
    } catch (importErr: any) {
      console.error('[TEST-CONNECTION] node-imap import failed:', importErr.message)
      return NextResponse.json({ error: `IMAP module unavailable: ${importErr.message}` }, { status: 500 })
    }

    return new Promise<NextResponse>((resolve) => {
      const imap = new Imap({
        user:        username,
        password,
        host:        imapHost,
        port:        Number(imapPort) || 993,
        tls:         useTls !== false,
        tlsOptions:  { rejectUnauthorized: false },
        connTimeout: 20000,
        authTimeout: 15000,
      })

      let settled = false
      const finish = (err?: string) => {
        if (settled) return
        settled = true
        try { imap.end() } catch {}
        if (err) {
          console.error('[TEST-CONNECTION] FAILED:', err)
          resolve(NextResponse.json({ error: err }, { status: 400 }))
        } else {
          console.log('[TEST-CONNECTION] SUCCESS')
          resolve(NextResponse.json({ success: true }))
        }
      }

      imap.once('ready', () => {
        console.log('[TEST-CONNECTION] IMAP ready, opening:', folder || 'INBOX')
        imap.openBox(folder || 'INBOX', true, (boxErr: Error) => {
          if (boxErr) {
            finish(`Connected but could not open mailbox "${folder || 'INBOX'}": ${boxErr.message}`)
          } else {
            finish()
          }
        })
      })

      imap.once('error', (err: Error) => {
        const msg = err.message || ''
        const friendly =
          msg.includes('Invalid credentials') || msg.includes('AUTHENTICATE') || msg.includes('535') || msg.includes('LOGIN')
            ? 'Authentication failed — check your email and password.'
            : msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('timeout')
            ? `Connection timed out — verify host "${imapHost}" and port ${imapPort}.`
            : msg.includes('certificate') || msg.includes('TLS') || msg.includes('SSL')
            ? 'TLS/SSL error — try toggling the secure connection setting.'
            : msg || 'IMAP connection failed.'
        finish(friendly)
      })

      imap.once('timeout', () => finish(`Connection timed out — verify host "${imapHost}" and port ${imapPort}.`))

      try {
        imap.connect()
      } catch (connErr: any) {
        finish(`Failed to start connection: ${connErr.message}`)
      }
    })
  } catch (err: any) {
    console.error('[TEST-CONNECTION] Unexpected error:', err.message)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}
