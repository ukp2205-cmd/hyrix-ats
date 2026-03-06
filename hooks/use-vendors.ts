'use client'

import { useState, useCallback, useEffect } from 'react'

export interface Vendor {
  id: string
  organization_id: string
  company_name: string
  location: string | null
  gst_number: string | null
  pan_number: string | null
  cin_cert_url: string | null
  gst_cert_url: string | null
  pan_copy_url: string | null
  created_at: string
  updated_at: string
}

export interface VendorFormData {
  company_name: string
  location: string
  gst_number: string
  pan_number: string
  cin_cert_url: string
  gst_cert_url: string
  pan_copy_url: string
}

export function useVendors(organizationId: string | null) {
  const [vendors, setVendors]   = useState<Vendor[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const fetchVendors = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/vendors?organizationId=${organizationId}`)
      const data = await res.json()
      if (data.success) setVendors(data.vendors)
      else setError(data.error)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  const addVendor = useCallback(async (form: VendorFormData): Promise<Vendor | null> => {
    if (!organizationId) return null
    const res  = await fetch('/api/vendors', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ organization_id: organizationId, ...form }),
    })
    const data = await res.json()
    if (data.success) {
      setVendors(prev => [data.vendor, ...prev])
      return data.vendor
    }
    throw new Error(data.error)
  }, [organizationId])

  const updateVendor = useCallback(async (id: string, form: VendorFormData): Promise<Vendor | null> => {
    const res  = await fetch('/api/vendors', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, ...form }),
    })
    const data = await res.json()
    if (data.success) {
      setVendors(prev => prev.map(v => v.id === id ? data.vendor : v))
      return data.vendor
    }
    throw new Error(data.error)
  }, [])

  const deleteVendor = useCallback(async (id: string): Promise<void> => {
    const res  = await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      setVendors(prev => prev.filter(v => v.id !== id))
    } else {
      throw new Error(data.error)
    }
  }, [])

  return { vendors, loading, error, fetchVendors, refresh: fetchVendors, addVendor, updateVendor, deleteVendor }
}
