'use client'

import { useEffect, useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Building2, Mail, Phone, MoreVertical, Users as UsersIcon, User,
  Calendar, Briefcase, RotateCcw, Settings2, GripVertical, Eye, EyeOff, X,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  location?: string
  team_id?: string
  team_name?: string
  status: string
  joined_date: string
  password?: string
  organization: { name: string }
}

interface TeamListProps {
  onEditMember?: (member: TeamMember) => void
  userRole?: 'admin' | 'recruiter' | 'super_admin'
  userEmail?: string | null
}

// All available columns definition — password is always shown, not in customizer
const ALL_COLUMNS = [
  { key: 'name',       label: 'Full Name',    required: true  },
  { key: 'email',      label: 'Email',        required: false },
  { key: 'phone',      label: 'Phone',        required: false },
  { key: 'role',       label: 'Role',         required: false },
  { key: 'team',       label: 'Assign Team',  required: false },
  { key: 'location',   label: 'Location',     required: false },
  { key: 'department', label: 'Department',   required: false },
  { key: 'status',     label: 'Status',       required: false },
  { key: 'date',       label: 'Joined Date',  required: false },
]

const DEFAULT_VISIBLE = new Set(['name', 'email', 'phone', 'role', 'status', 'date'])

export function TeamList({ onEditMember, userRole = 'admin', userEmail }: TeamListProps) {
  const { toast } = useToast()
  const [teamMembers, setTeamMembers]   = useState<TeamMember[]>([])
  const [loading, setLoading]           = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen]   = useState(false)
  const [selectedEmail, setSelectedEmail] = useState('')
  const [currentPage, setCurrentPage]   = useState(1)
  const itemsPerPage                    = 10
  const [statusFilter, setStatusFilter] = useState<string>('active')

  // Column customizer state — persisted to localStorage
  const STORAGE_KEY_ORDER   = 'hyrix_team_col_order'
  const STORAGE_KEY_VISIBLE = 'hyrix_team_col_visible'

  const [showCustomizer, setShowCustomizer] = useState(false)

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDER)
      if (saved) {
        const parsed: string[] = JSON.parse(saved)
        // Ensure any newly added columns are appended so nothing is lost
        const allKeys = ALL_COLUMNS.map(c => c.key)
        const merged  = [...parsed.filter(k => allKeys.includes(k)), ...allKeys.filter(k => !parsed.includes(k))]
        return merged
      }
    } catch { /* fall through */ }
    return ALL_COLUMNS.map(c => c.key)
  })

  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VISIBLE)
      if (saved) return new Set(JSON.parse(saved) as string[])
    } catch { /* fall through */ }
    return DEFAULT_VISIBLE
  })

  // Persist whenever column order or visibility changes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_ORDER, JSON.stringify(columnOrder)) } catch { /* silent */ }
  }, [columnOrder])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_VISIBLE, JSON.stringify([...visibleCols])) } catch { /* silent */ }
  }, [visibleCols])

  const customizerRef = useRef<HTMLDivElement>(null)

  // Drag-drop state
  const dragKey   = useRef<string | null>(null)
  const dragOver  = useRef<string | null>(null)

  // Close customizer on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customizerRef.current && !customizerRef.current.contains(e.target as Node)) {
        setShowCustomizer(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch org ID
  useEffect(() => {
    const userStr = localStorage.getItem('hyrix_user')
    if (!userStr) { setLoading(false); return }
    const user = JSON.parse(userStr)
    const currentUserEmail = userEmail || user.email
    const currentUserRole  = userRole  || user.role

    const fetchOrg = async () => {
      try {
        const fromTable = currentUserRole === 'recruiter' ? 'org_team' : 'organization'
        const selectCol = currentUserRole === 'recruiter' ? 'organization_id' : 'id'
        const res  = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'select', table: fromTable, select: selectCol, filters: [{ column: 'email', op: '=', value: currentUserEmail }], limit: 1 }),
          cache: 'no-store',
        })
        const json = await res.json()
        const row  = json.data?.[0]
        const orgId = currentUserRole === 'recruiter' ? row?.organization_id : row?.id
        if (orgId) setOrganizationId(orgId)
        else setLoading(false)
      } catch { setLoading(false) }
    }
    fetchOrg()
  }, [userRole, userEmail])

  // Fetch members — also fetches teams table and joins team_name by team_id
  useEffect(() => {
    if (!organizationId) return
    const load = async () => {
      try {
        // Fetch org_team members + teams table in parallel
        const [membersRes, teamsRes] = await Promise.all([
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ op: 'select', table: 'org_team', select: '*', filters: [{ column: 'organization_id', op: '=', value: organizationId }], orders: [{ column: 'created_at', ascending: false }] }),
            cache: 'no-store',
          }),
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ op: 'select', table: 'teams', select: 'id,team_name', filters: [{ column: 'organization_id', op: '=', value: organizationId }] }),
            cache: 'no-store',
          }),
        ])

        const membersJson = await membersRes.json()
        const teamsJson   = await teamsRes.json()

        // Build team_id → team_name lookup map
        const teamsMap = new Map<string, string>()
        if (teamsJson.data) {
          for (const t of teamsJson.data) {
            teamsMap.set(t.id, t.team_name)
          }
        }

        // Merge team_name into each member row
        if (membersJson.data) {
          const merged = membersJson.data.map((m: any) => ({
            ...m,
            team_name: m.team_id ? (teamsMap.get(m.team_id) ?? m.team_name ?? '—') : (m.team_name ?? '—'),
          }))
          setTeamMembers(merged as any)
        }
      } catch { /* silent */ }
      setLoading(false)
    }
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [organizationId])

  // Counts
  const activeCount   = teamMembers.filter(m => m.status === 'active').length
  const inactiveCount = teamMembers.filter(m => m.status === 'inactive').length
  const revokedCount  = teamMembers.filter(m => m.status === 'revoked').length

  const filtered      = teamMembers.filter(m => m.status === statusFilter)
  const totalPages    = Math.ceil(filtered.length / itemsPerPage)
  const paginated     = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Drag handlers
  const onDragStart = (key: string) => { dragKey.current = key }
  const onDragEnter = (key: string) => { dragOver.current = key }
  const onDragEnd   = () => {
    if (!dragKey.current || !dragOver.current || dragKey.current === dragOver.current) return
    setColumnOrder(prev => {
      const copy = [...prev]
      const from = copy.indexOf(dragKey.current!)
      const to   = copy.indexOf(dragOver.current!)
      copy.splice(from, 1)
      copy.splice(to, 0, dragKey.current!)
      return copy
    })
    dragKey.current  = null
    dragOver.current = null
  }

  const toggleCol = (key: string) => {
    setVisibleCols(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Ordered visible columns
  const orderedVisible = columnOrder
    .map(k => ALL_COLUMNS.find(c => c.key === k)!)
    .filter(c => c && visibleCols.has(c.key))

  const handleReactivate = async (memberId: string) => {
    const res  = await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'update', table: 'org_team', data: { status: 'active' }, filters: [{ column: 'id', op: '=', value: memberId }] }) })
    const json = await res.json()
    if (json.error) toast({ title: 'Error', description: json.error.message, variant: 'destructive' })
    else { toast({ title: 'Team member reactivated' }); setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'active' } : m)) }
  }

  const handleEmailClientSelect = (client: string) => {
    const urls: Record<string, string> = {
      gmail:   `https://mail.google.com/mail/?view=cm&fs=1&to=${selectedEmail}`,
      outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${selectedEmail}`,
      yahoo:   `https://compose.mail.yahoo.com/?to=${selectedEmail}`,
      default: `mailto:${selectedEmail}`,
    }
    window.open(urls[client], '_blank')
    setEmailDialogOpen(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4F46E5] border-t-transparent" />
    </div>
  )

  if (teamMembers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-white">
      <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg font-medium">No team members yet</p>
      <p className="text-sm text-muted-foreground">Click "Add Team Member" to create your first team member</p>
    </div>
  )

  const statusTabCfg = [
    { key: 'active',   label: 'Active',   count: activeCount,   dot: 'bg-green-500',  text: 'text-green-700'  },
    { key: 'inactive', label: 'Inactive', count: inactiveCount, dot: 'bg-yellow-500', text: 'text-yellow-700' },
    { key: 'revoked',  label: 'Revoked',  count: revokedCount,  dot: 'bg-red-500',    text: 'text-red-700'    },
  ]

  return (
    <div className="space-y-0">

      {/* ── STATUS TABS + COLUMNS BUTTON (same row) ────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          {statusTabCfg.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setCurrentPage(1) }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-semibold border border-b-0 transition-all ${
                statusFilter === tab.key
                  ? 'bg-white border-gray-200 text-[#4F46E5] shadow-sm'
                  : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${tab.dot}`} />
              {tab.label}
              <span className={`ml-1 text-xs font-bold rounded-full px-1.5 py-0.5 ${
                statusFilter === tab.key ? 'bg-[#4F46E5]/10 text-[#4F46E5]' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Customize Columns button — right-aligned, same row as tabs */}
        <div className="relative pb-0" ref={customizerRef}>
          <button
            onClick={() => setShowCustomizer(v => !v)}
            title="Customize columns"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg border border-b-0 text-xs font-semibold transition-all ${
              showCustomizer
                ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-white'
            }`}
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>Columns</span>
          </button>

          {/* Customizer panel */}
          {showCustomizer && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">Customize Columns</p>
                <button onClick={() => setShowCustomizer(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 px-4 pt-2 pb-1">Drag to reorder · Toggle to show/hide</p>
              <ul className="px-2 pb-3 space-y-0.5 max-h-72 overflow-y-auto">
                {columnOrder.map(key => {
                  const col = ALL_COLUMNS.find(c => c.key === key)!
                  const visible = visibleCols.has(key)
                  return (
                    <li
                      key={key}
                      draggable
                      onDragStart={() => onDragStart(key)}
                      onDragEnter={() => onDragEnter(key)}
                      onDragEnd={onDragEnd}
                      onDragOver={e => e.preventDefault()}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-purple-50 cursor-grab active:cursor-grabbing group select-none"
                    >
                      <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-400 shrink-0" />
                      <span className={`flex-1 text-sm ${visible ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                        {col.label}
                        {col.required && <span className="ml-1 text-[10px] text-[#4F46E5] font-semibold">Required</span>}
                      </span>
                      <button
                        disabled={col.required}
                        onClick={() => !col.required && toggleCol(key)}
                        className={`shrink-0 ${col.required ? 'opacity-30 cursor-not-allowed' : 'hover:text-[#4F46E5] cursor-pointer'}`}
                      >
                        {visible
                          ? <Eye className="h-4 w-4 text-[#4F46E5]" />
                          : <EyeOff className="h-4 w-4 text-gray-300" />
                        }
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="border-t border-gray-100 px-4 py-2 flex justify-between items-center bg-gray-50">
                <button
                  onClick={() => { setVisibleCols(DEFAULT_VISIBLE); setColumnOrder(ALL_COLUMNS.map(c => c.key)) }}
                  className="text-xs text-gray-500 hover:text-[#4F46E5] font-medium"
                >
                  Reset to default
                </button>
                <button
                  onClick={() => setVisibleCols(new Set(ALL_COLUMNS.map(c => c.key)))}
                  className="text-xs text-[#4F46E5] font-semibold hover:underline"
                >
                  Show all
                </button>
              </div>
            </div>
          )}
        </div>

      </div>{/* end of flex tabs+columns row */}

      {/* ── TABLE CARD (below the tabs row) ────────────────────────── */}
      <div className="rounded-b-lg rounded-tr-lg border border-gray-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50">
              <TableHead className="w-10 pl-4">
                <Checkbox />
              </TableHead>
              {orderedVisible.map(col => (
                <TableHead key={col.key} className="font-semibold text-gray-700 text-[13px] whitespace-nowrap">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={orderedVisible.length + 2} className="text-center py-12 text-gray-400 text-sm">
                  No {statusFilter} members found
                </TableCell>
              </TableRow>
            ) : paginated.map(member => (
              <TableRow key={member.id} className="border-b border-gray-100 hover:bg-purple-50/40 transition-colors">
                <TableCell className="pl-4" onClick={e => e.stopPropagation()}>
                  <Checkbox />
                </TableCell>

                {orderedVisible.map(col => {
                  switch (col.key) {
                    case 'name': return (
                      <TableCell key="name">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#4F46E5] font-medium text-[14px]">{member.name}</span>
                          <span className="text-gray-400 text-[12px]">{member.role}</span>
                        </div>
                      </TableCell>
                    )
                    case 'email': return (
                      <TableCell key="email" className="text-gray-600 text-[13px] max-w-[180px] truncate">
                        {member.email}
                      </TableCell>
                    )
                    case 'phone': return (
                      <TableCell key="phone">
                        <button
                          onClick={() => { const c = member.phone?.replace(/\D/g, ''); if (c) window.open(`https://wa.me/${c}`, '_blank') }}
                          className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-green-600 transition-colors"
                          title="WhatsApp"
                        >
                          <WhatsAppIcon className="h-3.5 w-3.5 text-green-500" />
                          {member.phone}
                        </button>
                      </TableCell>
                    )
                    case 'role': return (
                      <TableCell key="role">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[12px] font-medium text-indigo-700">
                          {member.role}
                        </span>
                      </TableCell>
                    )
                    case 'team': return (
                      <TableCell key="team" className="text-gray-600 text-[13px]">
                        {(member as any).team_name || '—'}
                      </TableCell>
                    )
                    case 'location': return (
                      <TableCell key="location" className="text-gray-600 text-[13px]">
                        {(member as any).location || '—'}
                      </TableCell>
                    )
                    case 'department': return (
                      <TableCell key="department" className="text-gray-600 text-[13px]">
                        {member.department || '—'}
                      </TableCell>
                    )
                    case 'status': return (
                      <TableCell key="status" onClick={e => e.stopPropagation()}>
                        <Select
                          value={member.status}
                          onValueChange={async (newStatus) => {
                            const res  = await fetch('/api/db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'update', table: 'org_team', data: { status: newStatus }, filters: [{ column: 'id', op: '=', value: member.id }] }) })
                            const json = await res.json()
                            if (json.error) toast({ title: 'Error', description: json.error.message, variant: 'destructive' })
                            else { toast({ title: `Status updated to ${newStatus}` }); setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m)) }
                          }}
                        >
                          <SelectTrigger className={`w-[110px] h-7 text-xs font-medium ${
                            member.status === 'active'   ? 'bg-green-50  text-green-700  border-green-200'  :
                            member.status === 'inactive' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">   <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500"  />Active</span></SelectItem>
                            <SelectItem value="inactive"> <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-yellow-500" />Inactive</span></SelectItem>
                            <SelectItem value="revoked">  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500"    />Revoked</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )
                    case 'date': return (
                      <TableCell key="date" className="text-gray-600 text-[13px] whitespace-nowrap">
                        {member.joined_date ? new Date(member.joined_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </TableCell>
                    )
                    default: return null
                  }
                })}

                {/* Actions */}
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsViewDialogOpen(true) }}>
                        <User className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setIsViewDialogOpen(false); onEditMember?.(member) }}>
                        View Details / Edit
                      </DropdownMenuItem>
                      {(member.status === 'revoked' || member.status === 'inactive') && (
                        <DropdownMenuItem onClick={() => handleReactivate(member.id)} className="text-green-600">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          {member.status === 'revoked' ? 'Reactivate' : 'Activate'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => { setSelectedEmail(member.email); setEmailDialogOpen(true) }}>
                        <Mail className="h-4 w-4 mr-2" /> Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = `tel:${member.phone}`}>
                        <Phone className="h-4 w-4 mr-2" /> Call Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>{/* end table card */}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-blue-600" /> Choose Email Client</DialogTitle>
            <DialogDescription>Send email to {selectedEmail}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {[
              { key: 'gmail',   label: 'Gmail',           sub: 'Open in Gmail web',    from: 'from-red-500 to-orange-500'  },
              { key: 'outlook', label: 'Outlook',         sub: 'Open in Outlook web',  from: 'from-blue-600 to-blue-700'   },
              { key: 'yahoo',   label: 'Yahoo Mail',      sub: 'Open in Yahoo web',    from: 'from-purple-600 to-purple-700'},
              { key: 'default', label: 'Default Mail App',sub: 'Open default client',  from: 'from-gray-600 to-gray-700'   },
            ].map(ec => (
              <Button key={ec.key} onClick={() => handleEmailClientSelect(ec.key)} variant="outline" className="h-auto py-3 justify-start">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${ec.from} flex items-center justify-center`}><Mail className="h-4 w-4 text-white" /></div>
                  <div className="text-left"><div className="font-semibold text-sm">{ec.label}</div><div className="text-xs text-gray-500">{ec.sub}</div></div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
            <DialogDescription>Complete information about this team member</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: User,      label: 'Full Name',   value: selectedMember.name },
                  { icon: Mail,      label: 'Email',       value: selectedMember.email },
                  { icon: Phone,     label: 'Phone',       value: selectedMember.phone },
                  { icon: Briefcase, label: 'Role',        value: selectedMember.role },
                  { icon: UsersIcon, label: 'Assign Team', value: (selectedMember as any).team_name || '—' },
                  { icon: Building2, label: 'Location',    value: (selectedMember as any).location  || '—' },
                  { icon: Building2, label: 'Department',  value: selectedMember.department || '—' },
                  { icon: Calendar,  label: 'Joined Date', value: selectedMember.joined_date ? new Date(selectedMember.joined_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <p className="text-sm font-medium break-all">{value}</p>
                  </div>
                ))}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-medium">Password</span>
                  </div>
                  <p className="text-sm font-mono tracking-widest text-gray-400">••••••••</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-medium">Status</span>
                  </div>
                  <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    selectedMember.status === 'active'   ? 'bg-green-50  text-green-700  border border-green-200'  :
                    selectedMember.status === 'inactive' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {selectedMember.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
