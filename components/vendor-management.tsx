'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useVendors } from '@/hooks/use-vendors'
import {
  Plus, Search, Edit, Trash2, Eye, X, ArrowLeft,
  Building2, FileText, UploadCloud, ExternalLink, Loader2,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────���──────────────────────────

export interface Vendor {
  id: string
  company_name: string
  location: string
  gst_number: string
  pan_number: string
  cin_cert_url: string | null
  gst_cert_url: string | null
  pan_copy_url: string | null
  created_at: string
}

const EMPTY_FORM = {
  id: '',
  company_name: '',
  location: '',
  gst_number: '',
  pan_number: '',
  cin_cert_url: '',
  gst_cert_url: '',
  pan_copy_url: '',
}

// ─── File Dropzone ────────────────────────────────────────────────────────────

function DocDropzone({ label, value, onUpload }: { label: string; value: string; onUpload: (url: string) => void }) {
  const inputRef                    = useRef<HTMLInputElement>(null)
  const [uploading, setUploading]   = useState(false)
  const [dragOver, setDragOver]     = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/upload-cv', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success && data.url) onUpload(data.url)
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
        className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[100px] p-3
          ${dragOver ? 'border-purple-400 bg-purple-50' : value ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50'}`}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        ) : value ? (
          <>
            <FileText className="h-6 w-6 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Uploaded</span>
            <div className="flex items-center gap-2">
              <a href={value} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="text-[11px] text-purple-600 font-semibold flex items-center gap-0.5 hover:underline">
                <ExternalLink className="h-3 w-3" /> View
              </a>
              <button type="button" onClick={e => { e.stopPropagation(); onUpload('') }}
                className="text-[11px] text-red-400 font-semibold flex items-center gap-0.5 hover:underline">
                <X className="h-3 w-3" /> Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-gray-300" />
            <span className="text-xs text-gray-400 text-center leading-tight">
              <span className="text-purple-600 font-semibold">Click</span> or drag {'&'} drop
            </span>
            <span className="text-[10px] text-gray-300">PDF, JPG, PNG</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface VendorManagementProps {
  organizationId: string | null
  onBack: () => void
  onAddVendor: () => void
  formOnly?: boolean
  editVendor?: Vendor | null
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VendorManagement({
  organizationId: propOrgId,
  onBack,
  onAddVendor,
  formOnly = false,
  editVendor = null,
}: VendorManagementProps) {
  const { toast } = useToast()

  const organizationId = propOrgId ?? (() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('hyrix_user') || '{}').organizationId || null }
    catch { return null }
  })()

  const { vendors, loading, addVendor, updateVendor, deleteVendor, refresh } = useVendors(organizationId)

  // ── Search (table view) ────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Form state (form view) ─────────────────────────────────────────────────
  const [form, setForm]     = useState({ ...EMPTY_FORM, ...(editVendor ?? {}) })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const isEditing           = !!editVendor

  useEffect(() => {
    if (editVendor) setForm({ ...EMPTY_FORM, ...editVendor })
  }, [editVendor])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.company_name.trim()) e.company_name = 'Company name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (isEditing && form.id) {
        await updateVendor(form.id, form)
        toast({ title: 'Vendor updated successfully' })
      } else {
        await addVendor({ ...form, organization_id: organizationId! })
        toast({ title: 'Vendor added successfully' })
      }
      onBack()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save vendor.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vendor? This action cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteVendor(id)
      toast({ title: 'Vendor deleted' })
    } catch {
      toast({ title: 'Error deleting vendor', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = vendors.filter(v =>
    !search ||
    v.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (v.gst_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.pan_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.location || '').toLowerCase().includes(search.toLowerCase())
  )

  // ══════════════════════════════════════════════════════════════════════════
  // FORM VIEW — shown when currentView === 'add-vendor'
  // ══════════════════════════════════════════════════════════════════════════
  if (formOnly) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Back header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</h2>
            <p className="text-sm text-gray-500">{isEditing ? 'Update vendor details' : 'Fill in the details to register a new vendor'}</p>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Company Name <span className="text-red-500">*</span></Label>
            <Input
              value={form.company_name}
              onChange={e => { setForm(f => ({ ...f, company_name: e.target.value })); setErrors(er => ({ ...er, company_name: '' })) }}
              placeholder="e.g. Acme Technologies Pvt Ltd"
              className={errors.company_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.company_name && <p className="text-xs text-red-600">{errors.company_name}</p>}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Location</Label>
            <Textarea
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Office address / city"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* GST + PAN */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">GST Number</Label>
              <Input
                value={form.gst_number}
                onChange={e => setForm(f => ({ ...f, gst_number: e.target.value.toUpperCase() }))}
                placeholder="22AAAAA0000A1Z5"
                className="font-mono"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">PAN Card Number</Label>
              <Input
                value={form.pan_number}
                onChange={e => setForm(f => ({ ...f, pan_number: e.target.value.toUpperCase() }))}
                placeholder="ABCDE1234F"
                className="font-mono"
                maxLength={10}
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Document Uploads</Label>
            <div className="grid grid-cols-3 gap-4">
              <DocDropzone label="CIN Certificate" value={form.cin_cert_url}
                onUpload={url => setForm(f => ({ ...f, cin_cert_url: url }))} />
              <DocDropzone label="GST Certificate" value={form.gst_cert_url}
                onUpload={url => setForm(f => ({ ...f, gst_cert_url: url }))} />
              <DocDropzone label="PAN Card Copy" value={form.pan_copy_url}
                onUpload={url => setForm(f => ({ ...f, pan_copy_url: url }))} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onBack} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Vendor' : 'Submit Vendor'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TABLE VIEW — shown when currentView === 'vendor-management'
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4 max-w-5xl mx-auto">

      {/* Header: title + Add Vendor button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Manage Vendors</h3>
          <p className="text-sm text-gray-500">View and manage your vendor companies</p>
        </div>
        <Button
          onClick={onAddVendor}
          className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search vendors by name, GST, PAN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['ID', 'Company Name', 'Location', 'GST Number', 'PAN Number', 'Documents', 'Actions'].map(h => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Loading vendors...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <Building2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    {search ? 'No vendors match your search' : 'No vendors added yet'}
                  </p>
                  {!search && <p className="text-xs text-gray-400 mt-1">Click "Add Vendor" to get started</p>}
                </td>
              </tr>
            ) : (
              filtered.map((v, idx) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-400 tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-500 shrink-0" />
                      <span className="font-medium text-gray-900 text-sm">{v.company_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-[140px]">
                    <span className="line-clamp-2">{v.location || <span className="text-gray-300">—</span>}</span>
                  </td>
                  <td className="px-4 py-4">
                    {v.gst_number
                      ? <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{v.gst_number}</span>
                      : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    {v.pan_number
                      ? <span className="font-mono text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">{v.pan_number}</span>
                      : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {v.cin_cert_url && (
                        <a href={v.cin_cert_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors">
                          <FileText className="h-3 w-3" /> CIN
                        </a>
                      )}
                      {v.gst_cert_url && (
                        <a href={v.gst_cert_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                          <FileText className="h-3 w-3" /> GST
                        </a>
                      )}
                      {v.pan_copy_url && (
                        <a href={v.pan_copy_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors">
                          <FileText className="h-3 w-3" /> PAN
                        </a>
                      )}
                      {!v.cin_cert_url && !v.gst_cert_url && !v.pan_copy_url && (
                        <span className="text-xs text-gray-300">No docs</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-[#4F46E5] hover:bg-indigo-50"
                        title="Edit vendor"
                        onClick={() => onAddVendor()}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete vendor"
                        disabled={deletingId === v.id}
                        onClick={() => handleDelete(v.id)}>
                        {deletingId === v.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </Button>
                      {(v.cin_cert_url || v.gst_cert_url || v.pan_copy_url) && (
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                          title="View documents"
                          onClick={() => window.open((v.cin_cert_url || v.gst_cert_url || v.pan_copy_url)!, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 px-1">
          Showing {filtered.length} of {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
