'use client'

import React from "react"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { Upload } from 'lucide-react'
import { uploadCV } from '@/app/actions/upload-cv'

interface CreateCandidateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCandidateModal({ open, onOpenChange }: CreateCandidateModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    email: '',
    current_location: '',
    preferred_location: '',
    skills: '',
    industry: '',
    experience_years: '',
    current_ctc: '',
    expected_ctc: '',
    notice_period: '',
    feedback: '',
    status: 'linedup',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    
    let cvUrl = null

    // Upload CV if provided using server action
    if (cvFile) {
      const formData = new FormData()
      formData.append('file', cvFile)
      
      const result = await uploadCV(formData)

      if (result.error) {
        console.error('[v0] Error uploading CV:', result.error)
        toast({
          title: 'CV Upload Failed',
          description: result.error,
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      cvUrl = result.url
      console.log('[v0] CV uploaded successfully:', cvUrl)
    }

    const { error } = await supabase.from('candidates').insert([
      {
        name: formData.name,
        mobile_number: formData.mobile_number,
        email: formData.email,
        current_location: formData.current_location,
        preferred_location: formData.preferred_location,
        skills: formData.skills,
        industry: formData.industry,
        years_of_experience: parseFloat(formData.experience_years),
        current_ctc: formData.current_ctc,
        expected_ctc: formData.expected_ctc,
        notice_period: formData.notice_period,
        feedback: formData.feedback,
        status: formData.status,
        cv_url: cvUrl,
      },
    ])

    if (error) {
      console.error('[v0] Error creating candidate:', error)
      toast({
        title: 'Error',
        description: 'Failed to add candidate. Please try again.',
        variant: 'destructive',
      })
    } else {
      console.log('[v0] Candidate created successfully')
      toast({
        title: '✓ Success',
        description: `${formData.name} has been added to the candidate pool successfully!`,
        className: 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white border-0',
      })
      setFormData({
        name: '',
        mobile_number: '',
        email: '',
        current_location: '',
        preferred_location: '',
        skills: '',
        industry: '',
        experience_years: '',
        current_ctc: '',
        expected_ctc: '',
        notice_period: '',
        feedback: '',
        status: 'linedup',
      })
      setCvFile(null)
      onOpenChange(false)
      window.location.reload()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
            Add New Candidate
          </DialogTitle>
          <DialogDescription>
            Fill in the candidate details and upload their CV
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number *</Label>
              <Input
                id="mobile_number"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email ID *</Label>
            <Input
              id="email"
              type="email"
              placeholder="candidate@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_location">Current Location *</Label>
              <Input
                id="current_location"
                placeholder="e.g. Mumbai"
                value={formData.current_location}
                onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_location">Preferred Location *</Label>
              <Input
                id="preferred_location"
                placeholder="e.g. Bangalore"
                value={formData.preferred_location}
                onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills * (comma separated)</Label>
            <Input
              id="skills"
              placeholder="e.g. React, Node.js, TypeScript"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                placeholder="e.g. IT Services"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience *</Label>
              <Input
                id="experience_years"
                type="number"
                placeholder="e.g. 5"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_ctc">Current CTC (in Lakhs) *</Label>
              <Input
                id="current_ctc"
                type="number"
                step="0.1"
                placeholder="e.g. 12.5"
                value={formData.current_ctc}
                onChange={(e) => setFormData({ ...formData, current_ctc: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_ctc">Expected CTC (in Lakhs) *</Label>
              <Input
                id="expected_ctc"
                type="number"
                step="0.1"
                placeholder="e.g. 15"
                value={formData.expected_ctc}
                onChange={(e) => setFormData({ ...formData, expected_ctc: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notice_period">Notice Period *</Label>
              <Input
                id="notice_period"
                placeholder="e.g. 30 days"
                value={formData.notice_period}
                onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="ringing">Ringing</SelectItem>
                  <SelectItem value="linedup">Lined Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Add any feedback or notes about the candidate..."
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cv">CV Upload</Label>
            <div className="flex items-center gap-2">
              <Input
                id="cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('cv')?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {cvFile ? cvFile.name : 'Choose CV File'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90"
            >
              {loading ? 'Adding...' : 'Add Candidate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
