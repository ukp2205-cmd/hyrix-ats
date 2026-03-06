'use server'

import storage from '@/lib/storage'

export async function uploadCV(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) {
    console.error('[v0] uploadCV: no file in formData')
    return { error: 'No file provided' }
  }

  console.log('[v0] uploadCV start — name:', file.name, '| size:', file.size, '| type:', file.type)

  // Validate env vars before attempting upload
  const missingVars = ['LIGHTSAIL_STORAGE_BUCKET','LIGHTSAIL_STORAGE_REGION','LIGHTSAIL_STORAGE_ACCESS_KEY','LIGHTSAIL_STORAGE_SECRET_KEY','LIGHTSAIL_STORAGE_ENDPOINT']
    .filter(k => !process.env[k])
  if (missingVars.length > 0) {
    console.error('[v0] uploadCV: missing env vars:', missingVars)
    return { error: `Storage not configured: missing ${missingVars.join(', ')}` }
  }

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const key = `resumes/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const buffer = Buffer.from(await file.arrayBuffer())
    console.log('[v0] uploadCV buffer size:', buffer.length, '| key:', key)

    const url = await storage.upload(key, buffer, file.type || 'application/octet-stream')
    console.log('[v0] uploadCV success — url:', url)

    return { success: true, url }
  } catch (error: any) {
    console.error('[v0] uploadCV failed:', error?.name, '|', error?.message, '|', error?.Code, '|', error?.$metadata)
    return { error: error.message || 'Failed to upload CV. Please try again.' }
  }
}
