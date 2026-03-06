import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code      = searchParams.get('code')
  const stateRaw  = searchParams.get('state') || '{}'
  const error     = searchParams.get('error')

  // Parse state — supports both plain orgId string and JSON {orgId, origin}
  let orgId  = ''
  let origin = req.nextUrl.origin
  try {
    const parsed = JSON.parse(stateRaw)
    orgId  = parsed.orgId  || ''
    origin = parsed.origin || req.nextUrl.origin
  } catch {
    orgId = stateRaw // fallback: state was plain orgId string
  }

  const appUrl       = origin
  const clientId     = process.env.GOOGLE_CLIENT_ID     || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  const redirectUri  = process.env.GOOGLE_REDIRECT_URI  || `${origin}/api/auth/callback/google`

  console.log('[GOOGLE CALLBACK] code received:', !!code, '| orgId:', orgId, '| origin:', origin)

  if (error) {
    return NextResponse.redirect(`${appUrl}/admin?tab=settings&gmailError=${encodeURIComponent(error)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${appUrl}/admin?tab=settings&gmailError=No+code+returned`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (tokens.error) {
      console.error('[GOOGLE CALLBACK] Token exchange error:', tokens.error_description)
      return NextResponse.redirect(`${appUrl}/admin?tab=settings&gmailError=${encodeURIComponent(tokens.error_description || tokens.error)}`)
    }

    const { access_token, refresh_token, expires_in } = tokens
    const expiry = new Date(Date.now() + (expires_in || 3600) * 1000)

    // Get user email from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const profile = await profileRes.json()
    const email   = profile.email || ''

    console.log('[GOOGLE CALLBACK] Authenticated as:', email, '| orgId:', orgId)

    // Save/upsert tokens in google_connections table
    await db.execute(`
      INSERT INTO google_connections
        (id, organization_id, email, access_token, refresh_token, expiry_date, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (organization_id)
      DO UPDATE SET
        email        = EXCLUDED.email,
        access_token = EXCLUDED.access_token,
        refresh_token = CASE WHEN EXCLUDED.refresh_token IS NOT NULL THEN EXCLUDED.refresh_token ELSE google_connections.refresh_token END,
        expiry_date  = EXCLUDED.expiry_date,
        updated_at   = NOW()
    `, [orgId, email, access_token, refresh_token || null, expiry])

    return NextResponse.redirect(`${appUrl}/admin?tab=settings&gmailConnected=true&gmailEmail=${encodeURIComponent(email)}`)
  } catch (err: any) {
    console.error('[GOOGLE CALLBACK] Error:', err.message)
    return NextResponse.redirect(`${appUrl}/admin?tab=settings&gmailError=${encodeURIComponent(err.message)}`)
  }
}
