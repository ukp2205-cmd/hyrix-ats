'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, FileText, Mail, FileCheck, ArrowLeft, Search, Eye, Filter } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/rich-text-editor'), { ssr: false })

interface Template {
  id: string
  name: string
  type: string
  subject?: string
  content: string
  variables?: any
  is_active: boolean
  created_at: string
}

interface TemplateManagementProps {
  userRole?: string
  organizationId?: string
  onBack?: () => void
}

export function TemplateManagement({ userRole, organizationId, onBack }: TemplateManagementProps) {
  const supabase = createClient()
  const { toast } = useToast()
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    variables: ''
  })

  useEffect(() => {
    fetchTemplates()
  }, [organizationId])

  const fetchTemplates = async () => {
    if (!organizationId) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch templates',
        variant: 'destructive'
      })
    } else {
      setTemplates(data || [])
    }
    setLoading(false)
  }

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        type: template.type,
        subject: template.subject || '',
        content: template.content,
        variables: template.variables ? JSON.stringify(template.variables, null, 2) : ''
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        name: '',
        type: 'email',
        subject: '',
        content: '',
        variables: ''
      })
    }
    setShowDialog(true)
  }

  const handleSaveTemplate = async () => {
    console.log('[v0] handleSaveTemplate called with formData:', {
      name: formData.name,
      type: formData.type,
      contentLength: formData.content?.length,
      contentPreview: formData.content?.substring(0, 100)
    })
    
    if (!formData.name || !formData.content) {
      console.log('[v0] Validation failed - missing name or content')
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    let variables = null
    if (formData.variables) {
      try {
        variables = JSON.parse(formData.variables)
      } catch (e) {
        console.log('[v0] Invalid JSON for variables:', e)
        toast({
          title: 'Error',
          description: 'Invalid JSON for variables',
          variant: 'destructive'
        })
        return
      }
    }

    const templateData = {
      organization_id: organizationId,
      name: formData.name,
      type: formData.type,
      subject: formData.type === 'email' ? formData.subject : null,
      content: formData.content,
      variables,
      is_active: true
    }
    
    console.log('[v0] Attempting to save template data:', { ...templateData, content: `${templateData.content?.substring(0, 50)}...` })

    if (editingTemplate) {
      // Update existing template
      console.log('[v0] Updating template:', editingTemplate.id)
      const { error } = await supabase
        .from('templates')
        .update(templateData)
        .eq('id', editingTemplate.id)

      if (error) {
        console.error('[v0] Error updating template:', error)
        toast({
          title: 'Error',
          description: `Failed to update template: ${error.message}`,
          variant: 'destructive'
        })
        return
      }

      console.log('[v0] Template updated successfully')
      toast({
        title: 'Success',
        description: 'Template updated successfully'
      })
    } else {
      // Create new template
      console.log('[v0] Creating new template')
      const { error, data } = await supabase
        .from('templates')
        .insert([templateData])
        .select()

      if (error) {
        console.error('[v0] Error creating template:', error)
        toast({
          title: 'Error',
          description: `Failed to create template: ${error.message}`,
          variant: 'destructive'
        })
        return
      }

      console.log('[v0] Template created successfully:', data)
      toast({
        title: 'Success',
        description: 'Template created successfully'
      })
    }

    setShowDialog(false)
    fetchTemplates()
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Success',
      description: 'Template deleted successfully'
    })
    fetchTemplates()
  }

  const handleViewTemplate = (template: Template) => {
    setViewingTemplate(template)
    setShowViewDialog(true)
  }

  // Filter templates based on search and type filter
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || template.type === typeFilter
    return matchesSearch && matchesType
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter])

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />
      case 'job_description':
        return <FileText className="h-5 w-5" />
      case 'offer_letter':
        return <FileCheck className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 mb-4 bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Button>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage email and document templates</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates by name or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px] h-10 bg-transparent">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="job_description">Job Description</SelectItem>
                <SelectItem value="offer_letter">Offer Letter</SelectItem>
                <SelectItem value="interview_invite">Interview Invitation</SelectItem>
                <SelectItem value="rejection_email">Rejection Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Templates Table */}
      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-4">Create your first template to get started</p>
          <Button onClick={() => handleOpenDialog()} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Template Name</TableHead>
                <TableHead className="w-[150px]">Type</TableHead>
                <TableHead className="w-[200px]">Subject</TableHead>
                <TableHead className="w-[180px]">Created Date</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getTemplateIcon(template.type)}
                      <span>{template.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {template.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {template.subject || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(template.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTemplate(template)}
                        className="h-8 w-8 p-0 bg-transparent"
                        title="View Template"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(template)}
                        className="h-8 w-8 p-0 bg-transparent"
                        title="Edit Template"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {filteredTemplates.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTemplates.length)} of {filteredTemplates.length} templates
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-transparent"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={page === currentPage ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white" : "bg-transparent"}
                        >
                          {page}
                        </Button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    return null
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-transparent"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* View Template Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingTemplate && getTemplateIcon(viewingTemplate.type)}
              {viewingTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Template Details
            </DialogDescription>
          </DialogHeader>

          {viewingTemplate && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-gray-500">Template Type</Label>
                  <Badge variant="secondary" className="capitalize mt-1">
                    {viewingTemplate.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge variant={viewingTemplate.is_active ? 'default' : 'secondary'}>
                      {viewingTemplate.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {viewingTemplate.subject && (
                <div>
                  <Label className="text-xs text-gray-500">Email Subject</Label>
                  <p className="mt-1 text-sm font-medium">{viewingTemplate.subject}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-gray-500">Content</Label>
                <Card className="mt-2 p-4 bg-gray-50">
                  <div 
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: viewingTemplate.content }}
                  />
                </Card>
              </div>

              {viewingTemplate.variables && (
                <div>
                  <Label className="text-xs text-gray-500">Variables</Label>
                  <Card className="mt-2 p-4 bg-gray-50">
                    <pre className="text-sm font-mono">
                      {JSON.stringify(viewingTemplate.variables, null, 2)}
                    </pre>
                  </Card>
                </div>
              )}

              <div>
                <Label className="text-xs text-gray-500">Created On</Label>
                <p className="mt-1 text-sm">
                  {new Date(viewingTemplate.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowViewDialog(false)} className="bg-transparent">
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewDialog(false)
                  handleOpenDialog(viewingTemplate)
                }} className="gap-2 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
                  <Edit className="h-4 w-4" />
                  Edit Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Template Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            <DialogDescription>
              Create templates for emails, job descriptions, and other documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="job_description">Job Description</SelectItem>
                    <SelectItem value="offer_letter">Offer Letter</SelectItem>
                    <SelectItem value="interview_invite">Interview Invitation</SelectItem>
                    <SelectItem value="rejection_email">Rejection Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="template-subject">Email Subject</Label>
                <Input
                  id="template-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Welcome to {company_name}"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="template-content">Content *</Label>
              {formData.type === 'job_description' || formData.type === 'offer_letter' ? (
                <>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    placeholder="Enter template content with formatting... Use {variable_name} for dynamic values"
                  />
                  <p className="text-xs text-gray-500">
                    Use rich text formatting for better presentation. Use curly braces for variables: {'{job_title}, {location}, {company_name}, etc.'}
                  </p>
                </>
              ) : (
                <>
                  <Textarea
                    id="template-content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter template content... Use {variable_name} for dynamic values"
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Use curly braces for variables: {'{candidate_name}, {job_title}, {company_name}, etc.'}
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-variables">Variables (JSON, optional)</Label>
              <Textarea
                id="template-variables"
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                placeholder={'{\n  "candidate_name": "string",\n  "job_title": "string"\n}'}
                className="min-h-[100px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Define variable schema as JSON (optional)
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:opacity-90 text-white">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
