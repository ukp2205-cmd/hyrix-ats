import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const REGION = process.env.LIGHTSAIL_STORAGE_REGION!
const ENDPOINT = process.env.LIGHTSAIL_STORAGE_ENDPOINT!
const BUCKET = process.env.LIGHTSAIL_STORAGE_BUCKET!
const ACCESS_KEY = process.env.LIGHTSAIL_STORAGE_ACCESS_KEY!
const SECRET_KEY = process.env.LIGHTSAIL_STORAGE_SECRET_KEY!

console.log('[v0] storage init — region:', REGION, '| endpoint:', ENDPOINT, '| bucket:', BUCKET, '| hasKey:', !!ACCESS_KEY)

// Lightsail Object Storage is S3-compatible
export const s3 = new S3Client({
  region: REGION || 'ap-south-1',
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: true, // required for Lightsail Object Storage
})

export const storage = {
  async upload(key: string, file: Buffer | Uint8Array, contentType: string): Promise<string> {
    console.log('[v0] storage.upload — bucket:', BUCKET, '| key:', key, '| contentType:', contentType, '| size:', file.length)
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: file,
          ContentType: contentType,
          // ACL removed — Lightsail does not support ACL headers by default
        })
      )
      console.log('[v0] storage.upload success')
    } catch (err: any) {
      console.error('[v0] storage.upload S3 error:', err?.name, err?.message, err?.Code)
      throw err
    }

    // Lightsail public URL format: https://[bucket].[region].object.lightsailstorage.com/[key]
    // If endpoint is already the full CDN URL, use it; otherwise build from parts
    const base = ENDPOINT.replace(/\/$/, '')
    const url = `${base}/${BUCKET}/${key}`
    console.log('[v0] storage.upload public URL:', url)
    return url
  },

  async delete(key: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    )
  },

  getPublicUrl(key: string): string {
    const base = ENDPOINT.replace(/\/$/, '')
    return `${base}/${BUCKET}/${key}`
  },
}

export default storage
