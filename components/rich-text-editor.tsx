'use client'

import React, { useRef, useEffect, useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const quillRef = useRef<any>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const initQuill = async () => {
      const Quill = (await import('quill')).default
      
      if (quillRef.current && !quillRef.current.quill) {
        // Register custom font sizes
        const Size = Quill.import('formats/size')
        Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']
        Quill.register(Size, true)

        const quill = new Quill(quillRef.current, {
          theme: 'snow',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              [{ 'size': ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'align': [] }],
              ['link'],
              [{ 'color': [] }, { 'background': [] }],
              ['blockquote', 'code-block'],
              ['clean']
            ]
          },
          formats: [
            'header',
            'size',
            'bold', 'italic', 'underline', 'strike',
            'list',
            'align',
            'link',
            'color', 'background',
            'blockquote', 'code-block'
          ],
          placeholder: placeholder || 'Start typing...'
        })

        // Set initial value
        if (value) {
          quill.clipboard.dangerouslyPasteHTML(value)
        }

        // Handle changes
        quill.on('text-change', (delta, oldDelta, source) => {
          const html = quill.root.innerHTML
          console.log('[v0] RichTextEditor content changed, length:', html.length, 'preview:', html.substring(0, 50))
          onChange(html)
        })
        
        // Block obvious binary file content from manual paste operations
        quill.clipboard.addMatcher(Node.TEXT_NODE, (node, delta) => {
          // Only check actual text nodes from clipboard paste, not programmatic updates
          if (node.nodeType === Node.TEXT_NODE && node.textContent) {
            const text = node.textContent
            
            // Detect actual binary garbage - look for specific binary file signatures
            // and high density of null bytes or control characters
            const nullBytes = (text.match(/\x00/g) || []).length
            const controlChars = (text.match(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g) || []).length
            
            // If more than 10% of content is null bytes or control chars, it's binary
            if (text.length > 50 && (nullBytes > text.length * 0.1 || controlChars > text.length * 0.15)) {
              console.log('[v0] Blocked binary file content from paste')
              return { ops: [] }
            }
            
            // Check for common binary file signatures (PDF, DOC, DOCX headers)
            if (text.includes('PK\x03\x04') || text.includes('%PDF') || text.includes('\xD0\xCF\x11\xE0')) {
              console.log('[v0] Blocked binary file from paste')
              return { ops: [] }
            }
          }
          
          return delta
        })

        // Store quill instance
        quillRef.current.quill = quill
      }
    }

    initQuill()
  }, [isMounted, placeholder])

  // Update content when value prop changes externally
  useEffect(() => {
    if (quillRef.current?.quill && value !== quillRef.current.quill.root.innerHTML) {
      const quill = quillRef.current.quill
      const currentSelection = quill.getSelection()
      quill.clipboard.dangerouslyPasteHTML(value)
      if (currentSelection) {
        quill.setSelection(currentSelection)
      }
    }
  }, [value])

  if (!isMounted) {
    return <div className="border rounded-lg p-4 min-h-[350px] bg-gray-50">Loading editor...</div>
  }

  return (
    <div className={className}>
      <div 
        ref={quillRef} 
        className="bg-white"
        style={{ height: '350px', marginBottom: '50px' }}
      />
    </div>
  )
}

export default RichTextEditor
