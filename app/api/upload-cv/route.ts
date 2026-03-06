import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Credentials are read INSIDE handlers (not at module level)
// so they always reflect the latest env var values at request time.
// CONFIRMED working: bucket-7votj4 / ap-south-1 / LIGHTSAIL_ACCESS_KEY_ID + LIGHTSAIL_ACCESS_SECRET_KEY

function getS3Config() {
  const BUCKET     = 'bucket-7votj4'
  const REGION     = 'ap-south-1'
  const ACCESS_KEY = process.env.LIGHTSAIL_ACCESS_KEY_ID    ?? ''
  const SECRET_KEY = process.env.LIGHTSAIL_ACCESS_SECRET_KEY ?? ''
  console.log('[v0] getS3Config — BUCKET:', BUCKET, '| REGION:', REGION, '| AK_first4:', ACCESS_KEY.slice(0,4), '| SK_len:', SECRET_KEY.length)
  return { BUCKET, REGION, ACCESS_KEY, SECRET_KEY }
}

export async function GET() {
  const { BUCKET, REGION, ACCESS_KEY, SECRET_KEY } = getS3Config()
  try {
    const s3 = new S3Client({
      region: REGION,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    })
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: 'test-connection.txt',
      Body: Buffer.from('ping'), ContentType: 'text/plain',
    }))
    console.log('[v0] GET test — SUCCESS')
    return NextResponse.json({ ok: true, bucket: BUCKET, region: REGION, akFirst4: ACCESS_KEY.slice(0,4) })
  } catch (err: any) {
    console.error('[v0] GET test — FAILED:', err?.name, err?.message)
    return NextResponse.json({ ok: false, error: err?.message, code: err?.Code ?? err?.name }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { BUCKET, REGION, ACCESS_KEY, SECRET_KEY } = getS3Config()

  if (!ACCESS_KEY || !SECRET_KEY) {
    console.error('[v0] POST — missing credentials: AK empty:', !ACCESS_KEY, '| SK empty:', !SECRET_KEY)
    return NextResponse.json({ error: 'Storage credentials not configured on server.' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e: any) {
    console.error('[v0] formData parse error:', e.message)
    return NextResponse.json({ error: 'Failed to read uploaded file.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || !file.size) {
    console.error('[v0] No file in formData — keys:', [...formData.keys()])
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  console.log('[v0] File received — name:', file.name, '| size:', file.size, '| type:', file.type)

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const key     = `resumes/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const buffer  = Buffer.from(await file.arrayBuffer())
    console.log('[v0] Uploading to S3 — key:', key, '| bufferSize:', buffer.length)

    const s3 = new S3Client({
      region: REGION,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    })

    const resp = await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    }))
    console.log('[v0] S3 upload SUCCESS — httpStatus:', resp?.$metadata?.httpStatusCode)

    const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
    console.log('[v0] Public URL:', url)
    return NextResponse.json({ success: true, url })

  } catch (err: any) {
    const detail = { name: err?.name, message: err?.message, code: err?.Code ?? err?.code, httpStatus: err?.$metadata?.httpStatusCode }
    console.error('[v0] S3 upload FAILED:', JSON.stringify(detail))
    return NextResponse.json(
      { error: `S3 Error [${detail.code ?? detail.name}]: ${detail.message}` },
      { status: 500 }
    )
  }
}
