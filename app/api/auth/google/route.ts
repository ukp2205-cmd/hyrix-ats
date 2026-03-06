import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('orgId') || ''

  const clientId = process.env.GOOGLE_CLIENT_ID

  if (!clientId) {
    // Return a visible HTML error page instead of silent JSON
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;max-width:500px;margin:auto">
        <h2 style="color:#dc2626">Google OAuth Not Configured</h2>
        <p>The <code>GOOGLE_CLIENT_ID</code> environment variable is not set.</p>
        <p>Please add the following environment variables in your Vercel project settings:</p>
        <ul>
          <li><code>GOOGLE_CLIENT_ID</code></li>
          <li><code>GOOGLE_CLIENT_SECRET</code></li>
        </ul>
        <p>Then add <strong>${req.nextUrl.origin}/api/auth/callback/google</strong> as an authorized redirect URI in your <a href="https://console.cloud.google.com">Google Cloud Console</a>.</p>
        <br/><a href="javascript:history.back()" style="color:#4f46e5">← Go Back</a>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // Derive redirect URI dynamically from the request origin — no env var needed
  const origin      = req.nextUrl.origin
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/callback/google`

  console.log('[GOOGLE AUTH] clientId first8:', clientId.slice(0, 8))
  console.log('[GOOGLE AUTH] redirectUri:', redirectUri)
  console.log('[GOOGLE AUTH] orgId:', orgId)

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    access_type:   'offline',
    prompt:        'consent select_account',
    scope:         [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    state: JSON.stringify({ orgId, origin }), // pass both orgId and origin through OAuth flow
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  console.log('[GOOGLE AUTH] Redirecting to Google:', authUrl.slice(0, 80))
  return NextResponse.redirect(authUrl)
}
