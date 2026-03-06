'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LayoutDashboard, Briefcase, Users, BarChart3, Settings as SettingsIcon, TrendingUp, TrendingDown, Eye, Clock, UserCheck, FileText, Calendar, Download, X, Menu, LogOut, Lock } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'

export default function AnalyticsPage() {
  const router = useRouter()
  const { hasModuleAccess, loading: permissionsLoading } = usePermissions()
  const [timeRange, setTimeRange] = useState('30')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplicants: 0,
    shortlisted: 0,
    avgTimeToHire: '0',
    applicationRate: 0,
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [applicationsOverTime, setApplicationsOverTime] = useState<any[]>([])
  const [jobsByDepartment, setJobsByDepartment] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Static application sources for now (could be extended with actual source tracking)
  const applicationSources = [
    { name: 'Direct', value: 35, fill: '#4F46E5' },
    { name: 'LinkedIn', value: 28, fill: '#7C3AED' },
    { name: 'Referral', value: 22, fill: '#06B6D4' },
    { name: 'Job Boards', value: 15, fill: '#10B981' },
  ]

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/recruiter' },
    { id: 'postings', label: 'Job Postings', icon: Briefcase, href: '/recruiter/postings' },
    { id: 'applicants', label: 'Applicants', icon: Users, href: '/recruiter?tab=candidates' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/recruiter/analytics' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, href: '/recruiter/settings' },
  ]

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    const supabase = createClient()

    // Fetch jobs and candidates data
    const { data: jobs } = await supabase.from('jobs').select('*').order('created_at', { ascending: true })
    const { data: candidates } = await supabase.from('candidates').select('*').order('created_at', { ascending: true })

    if (jobs && candidates) {
      const activeJobs = jobs.filter(j => j.status === 'active').length
      const shortlistedCount = candidates.filter(c => c.status === 'shortlisted').length
      
      setStats({
        totalJobs: jobs.length,
        activeJobs,
        totalApplicants: candidates.length,
        shortlisted: shortlistedCount,
        avgTimeToHire: '14',
        applicationRate: activeJobs > 0 ? Math.round(candidates.length / activeJobs) : 0,
      })

      // Calculate applications over time (last 6 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const last6Months = []
      const now = new Date()
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthName = monthNames[date.getMonth()]
        
        const monthCandidates = candidates.filter(c => {
          const candidateDate = new Date(c.created_at)
          const candidateKey = `${candidateDate.getFullYear()}-${String(candidateDate.getMonth() + 1).padStart(2, '0')}`
          return candidateKey === monthKey
        })
        
        last6Months.push({
          month: monthName,
          applications: monthCandidates.length,
          hired: monthCandidates.filter(c => c.status === 'hired' || c.status === 'shortlisted').length
        })
      }
      setApplicationsOverTime(last6Months)

      // Calculate jobs by department
      const departmentCounts: { [key: string]: number } = {}
      jobs.forEach(job => {
        const dept = job.department || 'Other'
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1
      })
      
      const colors = ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']
      const deptData = Object.entries(departmentCounts)
        .map(([department, count], index) => ({
          department,
          count,
          fill: colors[index % colors.length]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      setJobsByDepartment(deptData)

      // Recent activity from jobs and candidates
      const recentJobs = jobs.slice(-5).map(job => ({
        action: 'Job posting published',
        job: job.title,
        time: new Date(job.created_at).toLocaleDateString()
      }))
      
      const recentCandidates = candidates.slice(-5).map(candidate => ({
        action: 'New application received',
        job: jobs.find(j => j.id === candidate.job_id)?.title || 'Unknown position',
        time: new Date(candidate.created_at).toLocaleDateString()
      }))
      
      setRecentActivity([...recentCandidates, ...recentJobs].slice(-4))
    }

    setLoading(false)
  }

  // Check if user has no access to reports/analytics
  if (!permissionsLoading && !hasModuleAccess('Reports & Analytics')) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <Lock className="h-16 w-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-600">You don't have permission to view Reports & Analytics.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/recruiter')}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return (
  <div className="flex h-screen overflow-hidden bg-background">
  {/* Left Sidebar - Always Visible */}
      <aside className="w-64 border-r bg-white shadow-sm flex-shrink-0">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-bold text-sm">
              JK
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
                Hyrix
              </span>
              <p className="text-xs text-muted-foreground">Recruiter Portal</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = item.id === 'analytics'
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-lg shadow-[#4F46E5]/30'
                      : 'text-gray-600 hover:bg-blue-50/50 hover:text-[#4F46E5]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="border-t p-4">
            <button
              onClick={() => {
                localStorage.removeItem('hyrix_user')
                router.push('/login')
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8 shadow-sm">
          <div>
            <h1 className="text-lg font-semibold">Analytics Dashboard</h1>
            <p className="text-xs text-muted-foreground">Track your recruitment metrics</p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{stats.totalJobs}</div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 font-medium">+12%</span>
                    <span className="text-muted-foreground">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{stats.totalApplicants}</div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 font-medium">+24%</span>
                    <span className="text-muted-foreground">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{stats.shortlisted}</div>
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 font-medium">+8%</span>
                    <span className="text-muted-foreground">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Hiring Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Avg. Time to Hire</span>
                    </div>
                    <span className="text-sm font-semibold">{stats.avgTimeToHire} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Application Rate</span>
                    </div>
                    <span className="text-sm font-semibold">{stats.applicationRate} per job</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Active Positions</span>
                    </div>
                    <span className="text-sm font-semibold">{stats.activeJobs}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Job Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Total Views</span>
                    </div>
                    <span className="text-sm font-semibold">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    </div>
                    <span className="text-sm font-semibold">3.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Avg. Days Active</span>
                    </div>
                    <span className="text-sm font-semibold">18 days</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Applications Over Time - Line Chart */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Applications & Hiring Trend</CardTitle>
                <CardDescription className="text-xs">Monthly applications and successful hires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={applicationsOverTime}>
                      <defs>
                        <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <ChartTooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Area type="monotone" dataKey="applications" name="Applications" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorApplications)" />
                      <Area type="monotone" dataKey="hired" name="Hired" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorHired)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Jobs by Department & Application Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Jobs by Department</CardTitle>
                  <CardDescription className="text-xs">Distribution of job postings across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobsByDepartment}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="department" stroke="#6b7280" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <ChartTooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="count" name="Jobs" radius={[8, 8, 0, 0]}>
                          {jobsByDepartment.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Application Sources</CardTitle>
                  <CardDescription className="text-xs">Where candidates are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={applicationSources}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {applicationSources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <CardDescription className="text-xs">Latest recruitment activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.job}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
