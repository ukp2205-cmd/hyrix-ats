'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface JobFormData {
  title: string
  department: string
  location: string
  employment_type: string
  experience_level: string
  salary_range: string
  description: string
  requirements: string
  responsibilities: string
  benefits: string
  company_name: string
  company_description: string
  contact_email: string
  contact_name: string
  contact_phone: string
  assigned_recruiter: string
  status: string
  close_date: string
}

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    department: '',
    location: '',
    employment_type: 'Full-time',
    experience_level: '',
    salary_range: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    company_name: '',
    company_description: '',
    contact_email: '',
    contact_name: '',
    contact_phone: '',
    assigned_recruiter: '',
    status: 'active',
    close_date: '',
  })

  useEffect(() => {
    fetchJobData()
  }, [params.id])

  const fetchJobData = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load job data',
        variant: 'destructive',
      })
      return
    }

    if (data) {
      const parseArrayField = (field: any): string => {
        if (!field) return ''
        if (Array.isArray(field)) return field.join('\n')
        if (typeof field === 'string') return field
        return ''
      }

      setFormData({
        title: data.title || '',
        department: data.department || '',
        location: data.location || '',
        employment_type: data.employment_type || 'Full-time',
        experience_level: data.experience_level || '',
        salary_range: data.salary_range || '',
        description: data.description || '',
        requirements: parseArrayField(data.requirements),
        responsibilities: parseArrayField(data.responsibilities),
        benefits: parseArrayField(data.benefits),
        company_name: data.company_name || '',
        company_description: data.company_description || '',
        contact_email: data.contact_email || '',
        contact_name: data.contact_name || '',
        contact_phone: data.contact_phone || '',
        assigned_recruiter: data.assigned_recruiter || '',
        status: data.status || 'active',
        close_date: data.close_date || '',
      })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()
    console.log('[v0] Job edit - handleSubmit called')
    console.log('[v0] Job ID:', params.id)
    console.log('[v0] Form data:', formData)
    setSaving(true)

    const supabase = createClient()

    const parseTextToArray = (text: string): string[] => {
      return text.split('\n').map(item => item.trim()).filter(Boolean)
    }

    const updateData = {
      ...formData,
      requirements: parseTextToArray(formData.requirements),
      responsibilities: parseTextToArray(formData.responsibilities),
      benefits: parseTextToArray(formData.benefits),
      updated_at: new Date().toISOString(),
    }

    console.log('[v0] Update data prepared:', updateData)

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', params.id)
      .select()

    console.log('[v0] Supabase update response:', { data, error })

    if (error) {
      console.error('[v0] Error updating job:', error)
      toast({
        title: 'Error',
        description: `Failed to update job posting: ${error.message}`,
        variant: 'destructive',
      })
      setSaving(false)
      return
    }

    console.log('[v0] Job updated successfully')
    toast({
      title: 'Success',
      description: 'Job posting updated successfully',
    })

    router.push(`/admin/jobs/${params.id}`)
  }

  const handleChange = (field: keyof JobFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading job data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/jobs/${params.id}`)}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Job
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Job Posting</h1>
              <p className="text-sm text-muted-foreground">Update job details and requirements</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={(e) => {
              console.log('[v0] Save Changes button clicked')
              handleSubmit(e)
            }}
            disabled={saving}
            className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type *</Label>
                  <Select value={formData.employment_type} onValueChange={(value) => handleChange('employment_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Input
                    id="experience_level"
                    value={formData.experience_level}
                    onChange={(e) => handleChange('experience_level', e.target.value)}
                    placeholder="e.g., 3-5 years"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => handleChange('salary_range', e.target.value)}
                    placeholder="e.g., $80,000 - $120,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_recruiter">Assigned Recruiter</Label>
                  <Input
                    id="assigned_recruiter"
                    value={formData.assigned_recruiter}
                    onChange={(e) => handleChange('assigned_recruiter', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="close_date">Close Date</Label>
                  <Input
                    id="close_date"
                    type="date"
                    value={formData.close_date}
                    onChange={(e) => handleChange('close_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements (one per line)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  rows={6}
                  placeholder="Enter each requirement on a new line"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => handleChange('responsibilities', e.target.value)}
                  rows={6}
                  placeholder="Enter each responsibility on a new line"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => handleChange('benefits', e.target.value)}
                  rows={4}
                  placeholder="Enter each benefit on a new line"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_description">Company Description</Label>
                <Textarea
                  id="company_description"
                  value={formData.company_description}
                  onChange={(e) => handleChange('company_description', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => handleChange('contact_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
