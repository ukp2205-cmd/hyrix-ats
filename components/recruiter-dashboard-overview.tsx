'use client'

import { useState, useEffect } from 'react'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DashboardDateFilter, DateRange } from './dashboard-date-filter'
import {
  Users,
  PhoneCall,
  PhoneIncoming,
  UserCheck,
  XCircle,
  CheckCircle2,
  UserX,
  PhoneMissed,
  ListChecks,
  TrendingUp,
  Calendar,
  Briefcase,
  Clock,
  ChevronDown,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'

interface StatusCount {
  status: string
  count: number
  icon: any
  color: string
  bgColor: string
  label: string
}

interface SourceCount {
  source: string
  count: number
}

// ── Color palette for donut chart segments ──────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  'LinkedIn':      '#6366f1',
  'Referral':      '#22c55e',
  'Shine':         '#f59e0b',
  'WorkIndia':     '#14b8a6',
  'Indeed':        '#3b82f6',
  'Apna':          '#ec4899',
  'Naukri':        '#f97316',
  'IIM Jobs':      '#8b5cf6',
  'Data':          '#64748b',
  'Old Candidate': '#a78bfa',
  'email':         '#06b6d4',
  'Other':         '#cbd5e1',
}
const FALLBACK_COLORS = [
  '#6366f1','#22c55e','#f59e0b','#14b8a6','#3b82f6',
  '#ec4899','#f97316','#8b5cf6','#64748b','#a78bfa','#06b6d4',
]

// ── Custom label rendered inside donut segments ──────────────────────────────
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x} y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-800">{item.name}</p>
      <p className="text-gray-500">
        <span className="font-bold text-gray-900">{item.value}</span> candidate{item.value !== 1 ? 's' : ''}{' '}
        <span className="text-gray-400">({(item.payload.percent * 100).toFixed(1)}%)</span>
      </p>
    </div>
  )
}

export function RecruiterDashboardOverview() {
  const { userEmail, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [recruiterUuid, setRecruiterUuid] = useState<string | null>(null)

  const statusConfig: Record<string, { label: string; icon: any; color: string; bgColor: string; dot: string }> = {
    linedup:       { label: 'Lined Up',       icon: ListChecks,  color: 'text-blue-700',    bgColor: 'bg-blue-50',    dot: '#3b82f6' },
    ringing:       { label: 'Ringing',         icon: PhoneCall,   color: 'text-yellow-700',  bgColor: 'bg-yellow-50',  dot: '#eab308' },
    callback:      { label: 'Callback',        icon: PhoneIncoming,color:'text-purple-700',  bgColor: 'bg-purple-50',  dot: '#a855f7' },
    shortlisted:   { label: 'Shortlisted',     icon: UserCheck,   color: 'text-green-700',   bgColor: 'bg-green-50',   dot: '#22c55e' },
    rejected:      { label: 'Rejected',        icon: XCircle,     color: 'text-red-700',     bgColor: 'bg-red-50',     dot: '#ef4444' },
    final_select:  { label: 'Final Select',    icon: CheckCircle2,color: 'text-emerald-700', bgColor: 'bg-emerald-50', dot: '#10b981' },
    not_interested:{ label: 'Not Interested',  icon: UserX,       color: 'text-gray-600',    bgColor: 'bg-gray-50',    dot: '#9ca3af' },
    not_reachable: { label: 'Not Reachable',   icon: PhoneMissed, color: 'text-orange-700',  bgColor: 'bg-orange-50',  dot: '#f97316' },
  }

  const initialStatusCounts: StatusCount[] = Object.keys(statusConfig).map(status => ({
    status,
    count: 0,
    icon: statusConfig[status].icon,
    color: statusConfig[status].color,
    bgColor: statusConfig[status].bgColor,
    label: statusConfig[status].label,
  }))

  const [statusCounts, setStatusCounts]      = useState<StatusCount[]>(initialStatusCounts)
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [sourceCounts, setSourceCounts]      = useState<SourceCount[]>([])
  const [selectedSource, setSelectedSource]  = useState<string>('all')

  const getThisMonthRange = (): DateRange => {
    const now   = new Date()
    const from  = new Date(now.getFullYear(), now.getMonth(), 1)
    const to    = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from, to }
  }
  const [dateRange, setDateRange] = useState<DateRange>(getThisMonthRange())

  useEffect(() => {
    if (authLoading || !userEmail) return
    // Get recruiter UUID directly from localStorage (set at login as user.id = org_team.id)
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('hyrix_user') : null
    const user    = userStr ? JSON.parse(userStr) : null
    const uuid    = user?.id
    if (uuid) {
      setRecruiterUuid(uuid)
      fetchDashboardData(uuid)
    } else {
      setLoading(false)
    }
  }, [userEmail, authLoading])

  const fetchDashboardData = async (recruiterId: string, customDateRange?: DateRange) => {
    setLoading(true)
    const filterDateRange = customDateRange || dateRange
    try {
      // Fetch via /api/candidates — API resolves org from recruiterId automatically
      const url = `/api/candidates?recruiterId=${recruiterId}`
      const res  = await fetch(url)
      const json = await res.json()
      const allCandidates: any[] = json.success ? (json.candidates || []) : []

      // Apply date filter client-side
      const fromDate = filterDateRange.from
      const toDate   = new Date(filterDateRange.to)
      toDate.setHours(23, 59, 59, 999)
      const candidates = allCandidates.filter(c => {
        const d = new Date(c.created_at)
        return d >= fromDate && d <= toDate
      })

      // ── Status counts ─────────────────────────────────────────────────────
      const statusCountMap: Record<string, number> = {}
      Object.keys(statusConfig).forEach(s => { statusCountMap[s] = 0 })
      candidates?.forEach(c => {
        const s = c.status?.toLowerCase()
        if (s && s in statusCountMap) statusCountMap[s]++
      })
      const counts: StatusCount[] = Object.keys(statusConfig).map(status => ({
        status,
        count:   statusCountMap[status],
        icon:    statusConfig[status].icon,
        color:   statusConfig[status].color,
        bgColor: statusConfig[status].bgColor,
        label:   statusConfig[status].label,
      }))
      setStatusCounts(counts)
      setTotalCandidates(candidates?.length || 0)

      // ── Source counts ─────────────────────────────────────────────────────
      const sourceMap: Record<string, number> = {}
      candidates?.forEach(c => {
        const src = c.source?.trim() || 'Other'
        sourceMap[src] = (sourceMap[src] || 0) + 1
      })
      const sourceArr: SourceCount[] = Object.entries(sourceMap)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
      setSourceCounts(sourceArr)

      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const handleDateChange = (newRange: DateRange) => {
    setDateRange(newRange)
    if (recruiterUuid) fetchDashboardData(recruiterUuid, newRange)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const newApplicants = totalCandidates
  const activePostings = 5
  const pendingReview  = statusCounts.find(s => s.status === 'callback')?.count  || 0
  const totalHired     = statusCounts.find(s => s.status === 'final_select')?.count || 0

  // All sources from candidate creation page — always shown in dropdown
  const ALL_SOURCES = [
    'Direct', 'LinkedIn', 'Referral', 'Shine', 'WorkIndia',
    'Indeed', 'Apna', 'Naukri', 'IIM Jobs', 'Data', 'Old Candidate',
  ]

  // Build a lookup of source → count from fetched data
  const sourceCountMap = new Map(sourceCounts.map(s => [s.source, s.count]))

  // allDonutData — only sources with count > 0 (for the chart)
  const allDonutData = ALL_SOURCES
    .filter(s => (sourceCountMap.get(s) ?? 0) > 0)
    .map((s, i) => ({
      name:    s,
      value:   sourceCountMap.get(s) ?? 0,
      color:   SOURCE_COLORS[s] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      percent: totalCandidates > 0 ? (sourceCountMap.get(s) ?? 0) / totalCandidates : 0,
    }))

  // Apply source filter
  const selectedSourceHasCandidates = selectedSource === 'all' || (sourceCountMap.get(selectedSource) ?? 0) > 0
  const donutData = selectedSource === 'all'
    ? allDonutData
    : allDonutData.filter(d => d.name === selectedSource)

  const totalSourced = donutData.reduce((acc, d) => acc + d.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening with your recruitment.</p>
        </div>
        <DashboardDateFilter onDateChange={handleDateChange} />
      </div>

      {/* Top 4 Metric Cards — untouched */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">New Applicants</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{newApplicants}</p>
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />This month
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Postings</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{activePostings}</p>
              <Badge className="bg-green-50 text-green-700 hover:bg-green-100 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{pendingReview}</p>
              <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs">
                <Clock className="h-3 w-3 mr-1" />Awaiting
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Hired</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{totalHired}</p>
              <Badge className="bg-green-50 text-green-700 hover:bg-green-100 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />Success
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Two-panel section ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* ── LEFT: Candidate Status Breakdown ─────────────────────────── */}
        <Card className="border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 tracking-tight">
                  Candidate Pipeline
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Status breakdown across all stages</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-2xl font-black text-gray-900 leading-none">{totalCandidates}</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <div className="space-y-2">
              {statusCounts.map((s) => {
                const pct = totalCandidates > 0 ? (s.count / totalCandidates) * 100 : 0
                const dot = statusConfig[s.status]?.dot || '#9ca3af'
                const Icon = s.icon
                return (
                  <div key={s.status} className="group relative">
                    {/* Background track */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: `${dot}08` }}
                    />
                    <div className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors">
                      {/* Icon bubble */}
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${dot}18` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: dot }} />
                      </div>

                      {/* Label + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold tabular-nums" style={{ color: dot }}>
                              {pct > 0 ? `${pct.toFixed(1)}%` : '0%'}
                            </span>
                            <span
                              className="inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-black tabular-nums min-w-[22px]"
                              style={{ backgroundColor: `${dot}18`, color: dot }}
                            >
                              {s.count}
                            </span>
                          </div>
                        </div>
                        {/* Slim progress bar */}
                        <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${pct}%`, backgroundColor: dot }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── RIGHT: Sources of Applications Donut Chart ────────────────── */}
        <Card className="border border-gray-100 shadow-sm flex flex-col">
          <CardHeader className="pb-4 border-b border-gray-50">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold text-gray-900 tracking-tight">
                  Sources of Applications
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  {totalSourced} candidate{totalSourced !== 1 ? 's' : ''} sourced
                  {selectedSource !== 'all' && (
                    <span className="ml-1 text-purple-600 font-medium">· {selectedSource}</span>
                  )}
                </p>
              </div>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="h-7 w-[135px] text-xs border-purple-200 bg-purple-50 text-purple-700 font-semibold focus:ring-purple-300 shrink-0">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent align="end" className="max-h-64">
                  <SelectItem value="all" className="text-xs font-semibold">
                    All Sources
                    <span className="ml-2 text-gray-400 tabular-nums">{totalCandidates}</span>
                  </SelectItem>
                  {ALL_SOURCES.map((src, i) => {
                    const cnt   = sourceCountMap.get(src) ?? 0
                    const color = SOURCE_COLORS[src] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                    return (
                      <SelectItem key={src} value={src} className="text-xs">
                        <div className="flex items-center gap-2 w-full">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="flex-1">{src}</span>
                          <span className={`ml-2 tabular-nums font-semibold ${cnt === 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                            {cnt}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">

            {/* ── TOP: Donut + Legend ──────────────────────────────────────── */}
            <div className="flex-1 flex items-center px-4 pt-4 pb-2 min-h-0">
              {donutData.length === 0 && selectedSource !== 'all' ? (
                /* Specific source — no candidates */
                <div className="flex flex-col items-center justify-center w-full py-6 text-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-500">No candidates from {selectedSource}</p>
                    <p className="text-xs text-gray-400 mt-0.5">No candidate added with this source yet.</p>
                  </div>
                  <button onClick={() => setSelectedSource('all')} className="text-xs text-purple-600 font-semibold hover:underline">
                    View all sources
                  </button>
                </div>
              ) : donutData.length === 0 ? (
                /* No candidates at all */
                <div className="flex flex-col items-center justify-center w-full py-6 text-center gap-2">
                  <div className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No source data yet</p>
                  <p className="text-xs text-gray-400">Add candidates with a source to see the breakdown</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  {/* Donut */}
                  <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%" cy="50%"
                          innerRadius={46} outerRadius={74}
                          paddingAngle={2}
                          dataKey="value"
                          labelLine={false}
                          label={renderCustomLabel}
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={1.5} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold text-gray-900">{totalSourced}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Total</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {donutData.map((entry) => {
                      const pct = totalSourced > 0 ? (entry.value / totalSourced) * 100 : 0
                      return (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="flex-1 text-xs font-medium text-gray-600 truncate">{entry.name}</span>
                          <span className="text-xs font-bold tabular-nums text-gray-800">{pct.toFixed(1)}%</span>
                          <span className="text-[11px] tabular-nums text-gray-400 w-4 text-right">{entry.value}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── DIVIDER ──────────────────────────────────────────────────── */}
            <div className="mx-4 border-t border-gray-100" />

            {/* ── BOTTOM: Status Bar Chart (Recharts) ──────────────────────── */}
            <div className="px-2 pt-2 pb-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 px-2">Status Breakdown</p>
              {totalCandidates === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No data yet</p>
              ) : (() => {
                const barData = statusCounts.map(s => ({
                  name:  s.label.replace(' ', '\n'),
                  short: s.label.split(' ')[0],
                  count: s.count,
                  fill:  statusConfig[s.status]?.dot || '#9ca3af',
                }))
                const maxCount = Math.max(...barData.map(d => d.count), 1)
                return (
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart
                      data={barData}
                      margin={{ top: 16, right: 4, left: -28, bottom: 0 }}
                      barCategoryGap="20%"
                    >
                      <XAxis
                        dataKey="short"
                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                      />
                      <YAxis
                        domain={[0, maxCount + 1]}
                        tick={{ fontSize: 9, fill: '#cbd5e1' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={28}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 6 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0].payload
                          return (
                            <div className="rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 shadow-lg">
                              <p className="text-[11px] font-semibold text-gray-700">{d.name.replace('\n', ' ')}</p>
                              <p className="text-[11px] text-gray-500">
                                <span className="font-bold text-gray-900">{d.count}</span> candidate{d.count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={22} label={{
                        position: 'top',
                        fontSize: 9,
                        fontWeight: 700,
                        fill: '#64748b',
                        formatter: (v: number) => v > 0 ? v : '',
                      }}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={entry.count === 0 ? 0.18 : 0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              })()}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
