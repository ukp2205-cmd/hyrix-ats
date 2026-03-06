'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft, Building2, User, AtSign, MapPin, TrendingUp,
  Plus, Pencil, Trash2, Search, Phone, Mail, Globe,
  ChevronRight, Loader2, X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

/* ── helpers ─────────────────────────────────────────────────────────────── */
async function pgFetch(op: string, table: string, opts: Record<string, any> = {}) {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, table, ...opts }),
  })
  const json = await res.json()
  return { data: json.data ?? null, error: json.error ?? null }
}

function getOrgId(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem('hyrix_user') || '{}')
    return u.organization_id || u.orgId || null
  } catch { return null }
}

/* ── constants ───────────────────────────────────────────────────────────── */
const INDUSTRIES = [
  'Information Technology', 'Healthcare', 'Finance & Banking',
  'Manufacturing', 'Retail & E-commerce', 'Education', 'Real Estate',
  'Logistics & Supply Chain', 'Media & Entertainment', 'Consulting',
  'Telecommunications', 'Automotive', 'Construction', 'Pharmaceuticals', 'Other',
]
const LEAD_SOURCES = ['LinkedIn', 'Referral', 'Website', 'Event', 'Cold Call', 'Other']
const LEAD_STATUSES = ['New Lead', 'Contacted', 'Discussion', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost']

const STATUS_COLORS: Record<string, string> = {
  'New Lead':       'bg-blue-100 text-blue-700',
  'Contacted':      'bg-yellow-100 text-yellow-700',
  'Discussion':     'bg-purple-100 text-purple-700',
  'Proposal Sent':  'bg-orange-100 text-orange-700',
  'Negotiation':    'bg-amber-100 text-amber-700',
  'Closed Won':     'bg-green-100 text-green-700',
  'Closed Lost':    'bg-red-100 text-red-700',
}

/* ── types ───────────────────────────────────────────────────────────────── */
interface FormState {
  company_name: string; industry: string; num_employees: string
  annual_revenue: string; website: string; company_phone: string; company_email: string
  first_name: string; last_name: string; title: string
  contact_email: string; phone: string; mobile: string
  skype_id: string; linkedin_url: string; secondary_email: string; twitter_id: string
  lead_source: string; lead_status: string
  street: string; city: string; state: string; country: string; zip: string
}

const INITIAL: FormState = {
  company_name: '', industry: '', num_employees: '', annual_revenue: '',
  website: '', company_phone: '', company_email: '',
  first_name: '', last_name: '', title: '', contact_email: '', phone: '', mobile: '',
  skype_id: '', linkedin_url: '', secondary_email: '', twitter_id: '',
  lead_source: '', lead_status: 'New Lead',
  street: '', city: '', state: '', country: '', zip: '',
}

type FieldErrors = Partial<Record<keyof FormState, string>>
type View = 'list' | 'form'

/* ── sub-components ─────────────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{label}</h2>
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

/* ── IndustryAutoComplete ────────────────────────────────────────────────── */
function IndustryAutoComplete({
  value,
  onChange,
  suggestions,
}: {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
}) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState(value)
  const containerRef        = useRef<HTMLDivElement>(null)

  // Keep query in sync when form resets (edit mode)
  useEffect(() => { setQuery(value) }, [value])

  const filtered = query.trim().length === 0
    ? suggestions
    : suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  const handleSelect = (s: string) => {
    setQuery(s)
    onChange(s)
    setOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    onChange('')
    setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Search or type industry..."
          className="pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className={`w-full text-left px-3.5 py-2.5 text-sm hover:bg-[#4F46E5]/5 hover:text-[#4F46E5] transition-colors first:rounded-t-xl last:rounded-b-xl
                ${value === s ? 'bg-[#4F46E5]/8 text-[#4F46E5] font-medium' : 'text-gray-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── main component ─────────────────────────────────────────────────────── */
export function BDLeadSetup({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const [view, setView] = useState<View>('list')
  const [leads, setLeads] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [allIndustries, setAllIndustries] = useState<string[]>(INDUSTRIES)

  /* run DB migration on first mount (creates table if not exists) --------- */
  useEffect(() => {
    fetch('/api/migrate-bd-leads').catch(() => {})
  }, [])

  /* resolve org id -------------------------------------------------------- */
  useEffect(() => {
    const resolveOrg = async () => {
      try {
        const userStr = localStorage.getItem('hyrix_user')
        if (!userStr) return
        const user = JSON.parse(userStr)
        // Try org id from user object first
        let oid = user.organization_id || user.orgId || null
        if (!oid) {
          // Lookup from org_team (recruiter/HM) or organization (admin)
          const role = user.role || ''
          if (['recruiter', 'hiring_manager'].includes(role)) {
            const { data } = await pgFetch('select', 'org_team', {
              select: 'organization_id',
              filters: [{ column: 'email', op: '=', value: user.email }],
            })
            oid = (Array.isArray(data) ? data[0] : data)?.organization_id ?? null
          } else {
            const { data } = await pgFetch('select', 'organization', {
              select: 'id',
              filters: [{ column: 'email', op: '=', value: user.email }],
            })
            oid = (Array.isArray(data) ? data[0] : data)?.id ?? null
          }
        }
        setOrgId(oid)
      } catch {}
    }
    resolveOrg()
  }, [])

  /* fetch industries from DB — wait for migration so bd_leads table exists - */
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        // Ensure table exists first
        await fetch('/api/migrate-bd-leads')
        const [{ data: masterRows }, { data: bdRows }] = await Promise.all([
          pgFetch('select', 'industries', { select: 'name', orders: [{ column: 'name', ascending: true }] }),
          pgFetch('select', 'bd_leads', { select: 'industry', filters: [{ column: 'industry', op: '!=', value: null }] }),
        ])
        const fromMaster: string[] = (masterRows || []).map((r: any) => r.name).filter(Boolean)
        const fromBD: string[]     = (bdRows || []).map((r: any) => r.industry).filter(Boolean)
        const merged = Array.from(new Set([...fromMaster, ...fromBD, ...INDUSTRIES])).sort()
        if (merged.length > 0) setAllIndustries(merged)
      } catch {
        // fallback to static list already set
      }
    }
    fetchIndustries()
  }, [])

  /* fetch leads ----------------------------------------------------------- */
  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true)
    try {
      // Ensure table exists before querying
      await fetch('/api/migrate-bd-leads')
      const filters: any[] = []
      if (orgId) filters.push({ column: 'organization_id', op: '=', value: orgId })
      const { data, error } = await pgFetch('select', 'bd_leads', {
        filters,
        orders: [{ column: 'created_at', ascending: false }],
      })
      if (error) throw new Error(error.message)
      setLeads(data || [])
    } catch (e: any) {
      toast({ title: 'Error loading leads', description: e.message, variant: 'destructive' })
    } finally {
      setLoadingLeads(false)
    }
  }, [orgId, toast])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  /* form helpers ---------------------------------------------------------- */
  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }))

  const setSelect = (key: keyof FormState) => (val: string) =>
    setForm(p => ({ ...p, [key]: val }))

  const validate = () => {
    const errs: FieldErrors = {}
    if (!form.company_name.trim()) errs.company_name = 'Company name is required.'
    if (!form.contact_email.trim()) errs.contact_email = 'Contact email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email))
      errs.contact_email = 'Enter a valid email address.'
    if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openAdd = () => {
    setForm(INITIAL)
    setErrors({})
    setEditingId(null)
    setView('form')
  }

  const openEdit = (lead: any) => {
    setForm({
      company_name: lead.company_name || '', industry: lead.industry || '',
      num_employees: lead.num_employees?.toString() || '',
      annual_revenue: lead.annual_revenue?.toString() || '',
      website: lead.website || '', company_phone: lead.company_phone || '',
      company_email: lead.company_email || '', first_name: lead.first_name || '',
      last_name: lead.last_name || '', title: lead.title || '',
      contact_email: lead.contact_email || '', phone: lead.phone || '',
      mobile: lead.mobile || '', skype_id: lead.skype_id || '',
      linkedin_url: lead.linkedin_url || '', secondary_email: lead.secondary_email || '',
      twitter_id: lead.twitter_id || '', lead_source: lead.lead_source || '',
      lead_status: lead.lead_status || 'New Lead', street: lead.street || '',
      city: lead.city || '', state: lead.state || '',
      country: lead.country || '', zip: lead.zip || '',
    })
    setErrors({})
    setEditingId(lead.id)
    setView('form')
  }

  const handleSave = async () => {
    if (!validate()) {
      toast({ title: 'Validation Error', description: 'Please fix the errors below.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        ...form,
        num_employees: form.num_employees ? parseInt(form.num_employees) : null,
        annual_revenue: form.annual_revenue ? parseInt(form.annual_revenue) : null,
        updated_at: new Date().toISOString(),
      }
      if (orgId) payload.organization_id = orgId

      if (editingId) {
        const { error } = await pgFetch('update', 'bd_leads', {
          data: payload,
          filters: [{ column: 'id', op: '=', value: editingId }],
        })
        if (error) throw new Error(error.message)
        toast({ title: 'Lead Updated', description: `${form.company_name} updated successfully.` })
      } else {
        payload.created_at = new Date().toISOString()
        const { error } = await pgFetch('insert', 'bd_leads', { data: payload })
        if (error) throw new Error(error.message)
        toast({ title: 'Lead Added', description: `${form.company_name} added to your BD pipeline.` })
      }

      await fetchLeads()
      setView('list')
    } catch (e: any) {
      toast({ title: 'Save Failed', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const { error } = await pgFetch('delete', 'bd_leads', {
        filters: [{ column: 'id', op: '=', value: deleteId }],
      })
      if (error) throw new Error(error.message)
      toast({ title: 'Lead Deleted', description: 'BD lead removed successfully.' })
      await fetchLeads()
    } catch (e: any) {
      toast({ title: 'Delete Failed', description: e.message, variant: 'destructive' })
    } finally {
      setDeleteId(null)
    }
  }

  const filteredLeads = leads.filter(l =>
    !search.trim() ||
    l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.lead_status?.toLowerCase().includes(search.toLowerCase())
  )

  /* ── LIST VIEW ─────────────────────────────────────────────────────────── */
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}
                className="h-9 w-9 rounded-full hover:bg-white border border-gray-200">
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </Button>
              <div>
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Admin Settings</p>
                <h1 className="text-2xl font-bold text-gray-900">Business Development</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage potential client leads for your BD pipeline</p>
              </div>
            </div>
            <Button onClick={openAdd}
              className="gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl">
              <Plus className="h-4 w-4" /> Add New Lead
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by company, email, city or status..."
              className="pl-10 bg-white border-gray-200 rounded-xl"
            />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['New Lead', 'Discussion', 'Proposal Sent', 'Closed Won'].map(s => (
              <Card key={s} className="p-4 bg-white border-gray-100 shadow-sm">
                <p className="text-xs text-gray-500">{s}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {leads.filter(l => l.lead_status === s).length}
                </p>
              </Card>
            ))}
          </div>

          {/* Lead Cards */}
          {loadingLeads ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <Card className="p-12 text-center bg-white border-gray-100 shadow-sm">
              <TrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No leads found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? 'Try a different search.' : 'Click "Add New Lead" to get started.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map(lead => (
                <Card key={lead.id}
                  className="p-5 bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-xl bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-[#4F46E5]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm">{lead.company_name}</h3>
                          <Badge className={`text-[10px] px-2 py-0.5 font-medium ${STATUS_COLORS[lead.lead_status] || 'bg-gray-100 text-gray-600'}`}>
                            {lead.lead_status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {[lead.first_name, lead.last_name].filter(Boolean).join(' ')}
                          {lead.title ? ` · ${lead.title}` : ''}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {lead.phone && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Phone className="h-3 w-3" />{lead.phone}
                            </span>
                          )}
                          {lead.contact_email && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Mail className="h-3 w-3" />{lead.contact_email}
                            </span>
                          )}
                          {lead.city && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <MapPin className="h-3 w-3" />{lead.city}{lead.country ? `, ${lead.country}` : ''}
                            </span>
                          )}
                          {lead.lead_source && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Globe className="h-3 w-3" />{lead.lead_source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}
                        className="h-8 w-8 text-gray-400 hover:text-[#4F46E5] hover:bg-[#4F46E5]/10 rounded-lg">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(lead.id)}
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this BD lead from your database. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  /* ── FORM VIEW ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setView('list')}
            className="h-9 w-9 rounded-full hover:bg-white border border-gray-200">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Button>
          <div>
            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Business Development</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingId ? 'Edit Lead' : 'Add New Lead'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {editingId ? 'Update lead information below' : 'Fill in the details to add a new potential client'}
            </p>
          </div>
        </div>

        {/* Section 1 — Company */}
        <Card className="p-6 border-gray-100 shadow-sm bg-white">
          <SectionHeader icon={Building2} label="Company Information" color="bg-blue-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Company Name" required error={errors.company_name}>
              <Input value={form.company_name} onChange={set('company_name')}
                placeholder="e.g. Acme Corp"
                className={errors.company_name ? 'border-red-400' : ''} />
            </Field>
            <Field label="Industry">
              <IndustryAutoComplete
                value={form.industry}
                onChange={setSelect('industry')}
                suggestions={allIndustries}
              />
            </Field>
            <Field label="Number of Employees">
              <Input type="number" min={1} value={form.num_employees}
                onChange={set('num_employees')} placeholder="e.g. 250" />
            </Field>
            <Field label="Annual Revenue (INR)">
              <Input type="number" min={0} value={form.annual_revenue}
                onChange={set('annual_revenue')} placeholder="e.g. 5000000" />
            </Field>
            <Field label="Company Website">
              <Input type="url" value={form.website} onChange={set('website')}
                placeholder="https://example.com" />
            </Field>
            <Field label="Company Phone">
              <Input value={form.company_phone} onChange={set('company_phone')}
                placeholder="+91 98765 43210" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Company Email">
                <Input type="email" value={form.company_email} onChange={set('company_email')}
                  placeholder="hello@company.com" />
              </Field>
            </div>
          </div>
        </Card>

        {/* Section 2 — Contact Person */}
        <Card className="p-6 border-gray-100 shadow-sm bg-white">
          <SectionHeader icon={User} label="Contact Person Details" color="bg-violet-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="First Name">
              <Input value={form.first_name} onChange={set('first_name')} placeholder="John" />
            </Field>
            <Field label="Last Name">
              <Input value={form.last_name} onChange={set('last_name')} placeholder="Doe" />
            </Field>
            <Field label="Title / Designation">
              <Input value={form.title} onChange={set('title')} placeholder="e.g. HR Manager" />
            </Field>
            <Field label="Email" required error={errors.contact_email}>
              <Input type="email" value={form.contact_email} onChange={set('contact_email')}
                placeholder="john.doe@company.com"
                className={errors.contact_email ? 'border-red-400' : ''} />
            </Field>
            <Field label="Phone Number" required error={errors.phone}>
              <Input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210"
                className={errors.phone ? 'border-red-400' : ''} />
            </Field>
            <Field label="Mobile Number">
              <Input value={form.mobile} onChange={set('mobile')} placeholder="+91 98765 43210" />
            </Field>
          </div>
        </Card>

        {/* Section 3 — Additional Contact */}
        <Card className="p-6 border-gray-100 shadow-sm bg-white">
          <SectionHeader icon={AtSign} label="Additional Contact Information" color="bg-cyan-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Skype ID">
              <Input value={form.skype_id} onChange={set('skype_id')} placeholder="live:john.doe" />
            </Field>
            <Field label="LinkedIn Profile URL">
              <Input type="url" value={form.linkedin_url} onChange={set('linkedin_url')}
                placeholder="https://linkedin.com/in/johndoe" />
            </Field>
            <Field label="Secondary Email">
              <Input type="email" value={form.secondary_email} onChange={set('secondary_email')}
                placeholder="secondary@company.com" />
            </Field>
            <Field label="Twitter / X Handle">
              <Input value={form.twitter_id} onChange={set('twitter_id')} placeholder="@johndoe" />
            </Field>
          </div>
        </Card>

        {/* Section 4 — Lead Info */}
        <Card className="p-6 border-gray-100 shadow-sm bg-white">
          <SectionHeader icon={TrendingUp} label="Lead Information" color="bg-amber-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Lead Source">
              <Select value={form.lead_source} onValueChange={setSelect('lead_source')}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>{LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Lead Status">
              <Select value={form.lead_status} onValueChange={setSelect('lead_status')}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
        </Card>

        {/* Section 5 — Address */}
        <Card className="p-6 border-gray-100 shadow-sm bg-white">
          <SectionHeader icon={MapPin} label="Address Information" color="bg-emerald-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <Field label="Street Address">
                <Input value={form.street} onChange={set('street')} placeholder="123 Business Avenue" />
              </Field>
            </div>
            <Field label="City">
              <Input value={form.city} onChange={set('city')} placeholder="Mumbai" />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={set('state')} placeholder="Maharashtra" />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={set('country')} placeholder="India" />
            </Field>
            <Field label="Zip Code">
              <Input value={form.zip} onChange={set('zip')} placeholder="400001" />
            </Field>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => setView('list')} className="min-w-[100px]">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="min-w-[140px] bg-[#4F46E5] hover:bg-[#4338CA] text-white">
            {saving
              ? <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </span>
              : editingId ? 'Update Lead' : 'Save Lead'
            }
          </Button>
        </div>

      </div>
    </div>
  )
}
