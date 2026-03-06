import { NextResponse } from 'next/server'

export async function GET() {
  const clientId     = process.env.GOOGLE_CLIENT_ID     || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''

  return NextResponse.json({
    configured:       !!(clientId && clientSecret),
    client_id_set:    !!clientId,
    client_secret_set:!!clientSecret,
    client_id_first8: clientId ? clientId.slice(0, 8) + '...' : null,
  })
}
