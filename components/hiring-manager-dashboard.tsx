'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { LogOut, Users, UserCheck, CalendarDays, ListChecks, TrendingUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardDateFilter, DateRange } from '@/components/dashboard-date-filter'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ComposedChart,
  Cell,
} from 'recharts'
import {
  subDays, format, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, parseISO, getMonth, getYear
} from 'date-fns'

/* ─── types ──────────────────────────────────────────────────────────────── */
interface Candidate {
  id: string
  name: string
  status: string
  job_id: string
  created_at: string
}

/* ─── chart helpers ──────────────────────────────────────────────────────── */
const CHART_COLORS = {
  purple:  '#7C3AED',
  teal:    '#14B8A6',
  coral:   '#F43F5E',
  amber:   '#F59E0B',
  blue:    '#3B82F6',
  green:   '#10B981',
}

const lightPanelClass = 'bg-white rounded-2xl p-6 border border-gray-100 shadow-sm'

const LIGHT_AXIS = { fill: '#94a3b8', fontSize: 11 }
const LIGHT_GRID = { stroke: '#f1f5f9' }

function LightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-lg text-xs">
      {label && <p className="text-gray-500 mb-1 font-medium">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-semibold">
          {p.name}: <span className="text-gray-800">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ─���─ stat card ─────────────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, accent, trend,
}: {
  label: string; value: number | string; sub?: string
  icon: any; accent: string; trend?: number
}) {
  return (
    <div
      className="relative bg-white rounded-2xl p-5 flex flex-col gap-3 overflow-hidden shadow-sm border border-gray-100"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-start justify-between">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        {trend !== undefined && (
          <span
            className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: trend >= 0 ? '#d1fae5' : '#fee2e2', color: trend >= 0 ? '#059669' : '#dc2626' }}
          >
            <TrendingUp className="h-3 w-3" />
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ─── section label ─────────────────────────────────────────────────────── */
function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">{index}</span>
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">{label}</span>
    </div>
  )
}

/* ─── recruiter dropdown ─────────────────────────────────────────────────── */
function RecruiterDropdown({
  recruiters, value, onChange
}: {
  recruiters: { email: string; name: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 min-w-[160px] text-xs border-gray-200 rounded-lg bg-white font-medium">
        <Users className="h-3.5 w-3.5 text-[#4F46E5] mr-1.5 shrink-0" />
        <SelectValue placeholder="All Recruiters" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Recruiters</SelectItem>
        {recruiters.map(r => (
          <SelectItem key={r.email} value={r.email}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/* ─── main component ─────────────────────────────────────────────────────── */
export function HiringManagerDashboard({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter()
  const { userEmail, logout } = useAuth()

  const [candidates, setCandidates]               = useState<Candidate[]>([])
  const [loading, setLoading]                     = useState(true)
  const [hiringManagerName, setHiringManagerName] = useState('')
  const [orgId, setOrgId]                         = useState<string | null>(null)

  // Recruiter filter
  const [recruiters, setRecruiters]         = useState<{ email: string; name: string }[]>([])
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('all')

  // Lineup period dropdown (inside Weekly Lineup chart)
  const [lineupPeriod, setLineupPeriod] = useState<'day' | 'weekly' | 'monthly'>('weekly')

  const thisMonthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  }, [])
  const [dateRange, setDateRange] = useState<DateRange>({ from: thisMonthStart, to: new Date() })

  /* fetch org, recruiters, candidates --------------------------------------- */
  useEffect(() => {
    if (!userEmail) return
    const load = async () => {
      try {
        const supabase = createClient()

        // 1. Get hiring manager's org + their own org_team id
        const { data: hmData } = await supabase
          .from('org_team')
          .select('name, organization_id, id')
          .eq('email', userEmail)
          .single()

        if (!hmData) return
        setHiringManagerName(hmData.name)
        setOrgId(hmData.organization_id)

        // 2. Fetch active recruiters in this org for dropdown (store id + name + email)
        const { data: recruitersData } = await supabase
          .from('org_team')
          .select('id, name, email')
          .eq('organization_id', hmData.organization_id)
          .in('role', ['recruiter', 'Recruiter'])
          .eq('status', 'active')
          .order('name', { ascending: true })
        setRecruiters(
          (recruitersData || []).map(r => ({ email: r.id, name: r.name })) // use id as value key
        )

        // 3. Fetch all candidates in this org — join via created_by to get recruiter id
        const { data: cData } = await supabase
          .from('candidates')
          .select('id, name, status, job_id, created_at, created_by, assigned_to, source')
          .eq('organization_id', hmData.organization_id)
          .order('created_at', { ascending: false })

        // 4. Also fetch manager_pipeline which has assigned_recruiter UUID per candidate
        const { data: pipelineData } = await supabase
          .from('manager_pipeline')
          .select('candidate_id, assigned_recruiter, stage, selection_status')
          .eq('organization_id', hmData.organization_id)

        // Build map: candidate_id -> assigned_recruiter UUID
        const pipelineMap = new Map<string, string>()
        const pipelineStageMap = new Map<string, string>()
        ;(pipelineData || []).forEach((p: any) => {
          if (p.candidate_id) {
            pipelineMap.set(p.candidate_id, p.assigned_recruiter)
            pipelineStageMap.set(p.candidate_id, p.stage || p.selection_status || '')
          }
        })

        // Merge recruiter into each candidate row
        const merged = (cData || []).map((c: any) => ({
          ...c,
          // assigned_recruiter: prefer manager_pipeline, fallback to created_by
          recruiter_id: pipelineMap.get(c.id) || c.created_by || c.assigned_to || null,
          // override status from pipeline if available
          status: pipelineStageMap.get(c.id) || c.status,
        }))
        setCandidates(merged as any)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userEmail])

  /* filter by date + recruiter --------------------------------------------- */
  const filtered = useMemo(() => {
    const from = new Date(dateRange.from); from.setHours(0,0,0,0)
    const to   = new Date(dateRange.to);   to.setHours(23,59,59,999)
    return candidates.filter((c: any) => {
      const d = new Date(c.created_at)
      const inDate = d >= from && d <= to
      // selectedRecruiter stores org_team.id (UUID)
      const inRecruiter = selectedRecruiter === 'all' || c.recruiter_id === selectedRecruiter
      return inDate && inRecruiter
    })
  }, [candidates, dateRange, selectedRecruiter])

  /* recruiter-scoped base (ignores date range — for weekly lineup stat) ---- */
  const recruiterScoped = useMemo(() =>
    selectedRecruiter === 'all'
      ? candidates
      : candidates.filter((c: any) => c.recruiter_id === selectedRecruiter)
  , [candidates, selectedRecruiter])

  /* stat derivations ------------------------------------------------------- */
  const totalCandidates = filtered.length
  const totalJoined     = filtered.filter(c => ['joined'].includes(c.status?.toLowerCase())).length
  const totalSelects    = filtered.filter(c => ['selected', 'offer accepted', 'offer'].includes(c.status?.toLowerCase())).length

  // Weekly Lineup: recruiter-scoped candidates added in current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(new Date(),   { weekStartsOn: 1 })
  const weeklyLineup = recruiterScoped.filter(c => {
    const d = new Date(c.created_at)
    return d >= weekStart && d <= weekEnd
  }).length

  /* chart 1: candidate trend (bar+line) last 6 months — uses filtered ------ */
  const trendData = useMemo(() => {
    const months: { month: string; total: number; selected: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d  = new Date(); d.setMonth(d.getMonth() - i)
      const m  = d.getMonth(); const y = d.getFullYear()
      // Use recruiter-scoped (no date filter) for trend — date is already month
      const mc = recruiterScoped.filter(c => {
        const cd = new Date(c.created_at)
        return cd.getMonth() === m && cd.getFullYear() === y
      })
      months.push({
        month:    format(d, 'MMM'),
        total:    mc.length,
        selected: mc.filter(c => ['selected','shortlisted','joined','offer accepted'].includes(c.status?.toLowerCase())).length,
      })
    }
    return months
  }, [recruiterScoped])

  /* chart 2: status breakdown grouped bar --------------------------------- */
  const STATUS_GROUPS = [
    { key: 'linedup',    label: 'Lined Up'   },
    { key: 'ringing',   label: 'Ringing'    },
    { key: 'callback',  label: 'Callback'   },
    { key: 'shortlisted', label: 'Shortlisted' },
    { key: 'selected',  label: 'Selected'   },
    { key: 'rejected',  label: 'Rejected'   },
    { key: 'joined',    label: 'Joined'     },
  ]
  const statusData = useMemo(() =>
    STATUS_GROUPS.map(s => ({
      name:  s.label,
      count: filtered.filter(c => c.status?.toLowerCase() === s.key).length,
    })).filter(s => s.count > 0)
  , [filtered])

  const STATUS_BAR_COLORS = [
    CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.purple,
    CHART_COLORS.teal, CHART_COLORS.green, CHART_COLORS.coral,
    CHART_COLORS.purple,
  ]

  /* chart 3: source-wise hiring — dynamic from candidates.source field ------ */
  const SOURCE_COLORS = [
    '#3B82F6', // blue   — LinkedIn
    '#22C55E', // green  — Referral
    '#F59E0B', // amber  — Job Portals
    '#8B5CF6', // purple — Company Site
    '#F97316', // orange — Walk-in
    '#EC4899', // pink   — Consultancy
    '#EF4444', // red    — Campus
    '#14B8A6', // teal   — others
  ]

  const sourceData = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((c: any) => {
      const src = (c.source || '').trim()
      if (!src) return
      map.set(src, (map.get(src) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
  }, [filtered])

  /* chart 4: lineup data — uses recruiterScoped, responds to period -------- */
  const lineupData = useMemo(() => {
    const src = recruiterScoped

    if (lineupPeriod === 'day') {
      // Last 24 hours, hour by hour (show last 12 hours)
      return Array.from({ length: 12 }, (_, i) => {
        const h = new Date(); h.setMinutes(0,0,0); h.setHours(h.getHours() - (11 - i))
        return {
          label: format(h, 'ha'),
          count: src.filter(c => {
            const d = new Date(c.created_at)
            return d.getHours() === h.getHours() && isSameDay(d, h)
          }).length,
        }
      })
    }

    if (lineupPeriod === 'weekly') {
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
      return weekDays.map(day => ({
        label: format(day, 'EEE'),
        count: src.filter(c => isSameDay(new Date(c.created_at), day)).length,
      }))
    }

    // monthly — last 6 months
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i))
      const m = d.getMonth(); const y = d.getFullYear()
      return {
        label: format(d, 'MMM'),
        count: src.filter(c => {
          const cd = new Date(c.created_at)
          return cd.getMonth() === m && cd.getFullYear() === y
        }).length,
      }
    })
  }, [recruiterScoped, lineupPeriod, weekStart, weekEnd])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="h-9 w-9 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={embedded ? 'font-sans' : 'min-h-screen bg-[#F5F6FA] font-sans'}>

      {/* ── Standalone header — hidden when embedded inside AdminDashboard ── */}
      {!embedded && (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Hiring Manager Portal</h1>
              <p className="text-xs text-gray-500">Welcome back, <span className="font-semibold text-[#4F46E5]">{hiringManagerName}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <RecruiterDropdown recruiters={recruiters} value={selectedRecruiter} onChange={setSelectedRecruiter} />
              <DashboardDateFilter onDateChange={setDateRange} />
              <Button onClick={() => { logout(); router.push('/login') }} variant="outline" size="sm" className="text-xs gap-1.5">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? 'space-y-8' : 'max-w-7xl mx-auto px-6 py-8 space-y-10'}>

        {/* Filter row — shown inline when embedded */}
        {embedded && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500 shrink-0">Welcome back, <span className="font-semibold text-[#4F46E5]">{hiringManagerName}</span></p>
            <div className="flex items-center gap-2 ml-auto">
              <RecruiterDropdown recruiters={recruiters} value={selectedRecruiter} onChange={setSelectedRecruiter} />
              <DashboardDateFilter onDateChange={setDateRange} />
            </div>
          </div>
        )}

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total Candidates" value={totalCandidates} sub="In selected period"  icon={Users}        accent={CHART_COLORS.purple} trend={12} />
          <StatCard label="Total Joined"      value={totalJoined}     sub="Shortlisted & above" icon={UserCheck}     accent={CHART_COLORS.teal}   trend={8}  />
          <StatCard label="Selects"           value={totalSelects}    sub="Offer accepted"      icon={ListChecks}    accent={CHART_COLORS.green}  trend={5}  />
          <StatCard label="Weekly Lineup"     value={weeklyLineup}    sub="This Mon – Sat"      icon={CalendarDays}  accent={CHART_COLORS.amber}  />
        </div>

        {/* ── Section 01: Trend + Weekly ────────���────────────────────────── */}
        <div>
          <SectionLabel index="01" label="Monthly Trend · Weekly Lineup" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Monthly Bar + Line */}
            <div className={lightPanelClass}>
              <p className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#7C3AED] inline-block" />
                Monthly Hiring Trend (Last 6 Months)
              </p>
              <p className="text-[11px] text-gray-400 mb-5">Total vs Selected/Shortlisted candidates</p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid {...LIGHT_GRID} vertical={false} />
                  <XAxis dataKey="month" tick={LIGHT_AXIS} axisLine={false} tickLine={false} />
                  <YAxis tick={LIGHT_AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<LightTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 12 }}
                    formatter={(v) => <span style={{ color: '#64748b' }}>{v}</span>}
                  />
                  <Bar dataKey="total" name="Total" fill={CHART_COLORS.purple} radius={[4,4,0,0]} maxBarSize={32} fillOpacity={0.85} />
                  <Line dataKey="selected" name="Selected/Joined" type="monotone" stroke={CHART_COLORS.teal} strokeWidth={2.5} dot={{ fill: CHART_COLORS.teal, r: 4, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Lineup — period switchable */}
            <div className={lightPanelClass}>
              <div className="flex items-start justify-between mb-0.5">
                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#F59E0B] inline-block" />
                  {lineupPeriod === 'day' ? 'Today\'s Lineup' : lineupPeriod === 'weekly' ? 'Weekly Lineup' : 'Monthly Lineup'}
                </p>
                {/* Period toggle dropdown */}
                <Select value={lineupPeriod} onValueChange={(v: any) => setLineupPeriod(v)}>
                  <SelectTrigger className="h-7 w-28 text-xs border-gray-200 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[11px] text-gray-400 mb-4">
                {lineupPeriod === 'day' ? 'Candidates added today, hour by hour' : lineupPeriod === 'weekly' ? 'Candidates added this week, day by day' : 'Candidates added over last 6 months'}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={lineupData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid {...LIGHT_GRID} vertical={false} />
                  <XAxis dataKey="label" tick={LIGHT_AXIS} axisLine={false} tickLine={false} />
                  <YAxis tick={LIGHT_AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<LightTooltip />} />
                  <Bar dataKey="count" name="Candidates" radius={[5,5,0,0]} maxBarSize={36}>
                    {lineupData.map((_, i) => (
                      <Cell key={i} fill={`${CHART_COLORS.purple}99`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* ── Section 02: Status Breakdown + Source-Wise Hiring ─────────── */}
        <div>
          <SectionLabel index="02" label="Status Breakdown · Source-Wise Hiring" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Status Breakdown */}
            <div className={lightPanelClass}>
              <p className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#14B8A6] inline-block" />
                Candidate Status Breakdown
              </p>
              <p className="text-[11px] text-gray-400 mb-5">Count by pipeline stage in selected period</p>
              {statusData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px]">
                  <p className="text-sm text-gray-400">No data in selected period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 24, left: 12, bottom: 0 }}>
                    <CartesianGrid {...LIGHT_GRID} horizontal={false} />
                    <XAxis type="number" tick={LIGHT_AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ ...LIGHT_AXIS, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<LightTooltip />} />
                    <Bar dataKey="count" name="Candidates" radius={[0,5,5,0]} maxBarSize={22}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={STATUS_BAR_COLORS[i % STATUS_BAR_COLORS.length]} fillOpacity={0.88} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Source-Wise Hiring */}
            <div className={lightPanelClass}>
              <p className="text-sm font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B] inline-block" />
                Source-Wise Hiring
              </p>
              <p className="text-[11px] text-gray-400 mb-5">Candidates by application source in selected period</p>
              {sourceData.length === 0 ? (
                <div className="flex items-center justify-center h-[220px]">
                  <p className="text-sm text-gray-400">No source data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(220, sourceData.length * 38)}>
                  <BarChart
                    data={sourceData}
                    layout="vertical"
                    margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid {...LIGHT_GRID} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={LIGHT_AXIS}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="source"
                      tick={{ ...LIGHT_AXIS, fill: '#475569', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      width={110}
                    />
                    <Tooltip content={<LightTooltip />} />
                    <Bar dataKey="count" name="Candidates" radius={[0, 6, 6, 0]} maxBarSize={24}>
                      {sourceData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={SOURCE_COLORS[i % SOURCE_COLORS.length]}
                          fillOpacity={0.9}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}
