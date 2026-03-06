'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestStoragePage() {
  const [status, setStatus] = useState<string>('Click button to test storage')
  const [buckets, setBuckets] = useState<any[]>([])

  const testStorage = async () => {
    setStatus('Testing storage configuration...')
    const supabase = createClient()

    try {
      // List buckets
      const { data: bucketsData, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        setStatus(`❌ Error listing buckets: ${bucketsError.message}`)
        return
      }

      setBuckets(bucketsData || [])
      
      const jobKarleResume = bucketsData?.find(b => b.id === 'JobKarle-Resume')
      
      if (!jobKarleResume) {
        setStatus('❌ Bucket "JobKarle-Resume" does not exist. Please create it in Supabase dashboard.')
        return
      }

      setStatus(`✅ Bucket "JobKarle-Resume" exists and is ${jobKarleResume.public ? 'PUBLIC' : 'PRIVATE'}`)
      
      // Try to list files
      const { data: files, error: listError } = await supabase.storage
        .from('JobKarle-Resume')
        .list()

      if (listError) {
        setStatus(prev => prev + `\n⚠️ Warning: Cannot list files - ${listError.message}`)
      } else {
        setStatus(prev => prev + `\n✅ Can list files (${files?.length || 0} files found)`)
      }

    } catch (error) {
      setStatus(`❌ Unexpected error: ${error}`)
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Storage Configuration Test</CardTitle>
          <CardDescription>
            Test the JobKarle-Resume storage bucket configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testStorage} className="w-full">
            Test Storage
          </Button>
          
          <div className="rounded-lg border bg-muted p-4">
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
          </div>

          {buckets.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Available Buckets:</h3>
              <ul className="space-y-1">
                {buckets.map(bucket => (
                  <li key={bucket.id} className="text-sm">
                    {bucket.name} - {bucket.public ? '🌐 Public' : '🔒 Private'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border bg-blue-50 p-4 text-sm dark:bg-blue-950">
            <h4 className="font-semibold mb-2">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to Supabase Dashboard → Storage</li>
              <li>Create bucket named "JobKarle-Resume"</li>
              <li>Enable "Public bucket" option</li>
              <li>Add RLS policies for INSERT, SELECT, UPDATE, DELETE</li>
              <li>Return here and click "Test Storage" again</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
