'use server'

import mammoth from 'mammoth'
import { formatText } from './format-text' // Assuming formatText is declared in another file

export async function parseJD(formData: FormData) {
  try {
    const file = formData.get('file') as File
    
    console.log('[v0] parseJD called, file:', file ? file.name : 'NO FILE')
    
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    const fileName = file.name.toLowerCase()
    console.log('[v0] Processing file:', fileName, 'size:', file.size, 'type:', file.type)
    
    // Enhanced function to format text with proper HTML structure
    const formatTextToHTML = (text: string): string => {
      // Split by double newlines to identify paragraphs
      const paragraphs = text.split(/\n\s*\n/)
      let html = ''
      let inList = false
      let listItems: string[] = []
      
      const flushList = () => {
        if (inList && listItems.length > 0) {
          html += '<ul>\n'
          for (const item of listItems) {
            html += `  <li>${item}</li>\n`
          }
          html += '</ul>\n'
          listItems = []
          inList = false
        }
      }
      
      for (const para of paragraphs) {
        const lines = para.split('\n').map(l => l.trim()).filter(Boolean)
        
        if (lines.length === 0) continue
        
        // Check if this paragraph is a list block
        const isListBlock = lines.every(line => 
          /^[•\-\*]\s/.test(line) || 
          /^\d+[\.)]\s/.test(line) ||
          /^[a-z][\.)]\s/i.test(line)
        )
        
        if (isListBlock) {
          // Start or continue list
          inList = true
          for (const line of lines) {
            // Remove bullet/number prefix
            const cleaned = line
              .replace(/^[•\-\*]\s+/, '')
              .replace(/^\d+[\.)]\s+/, '')
              .replace(/^[a-z][\.)]\s+/i, '')
            listItems.push(cleaned)
          }
          continue
        } else {
          // Flush any pending list before processing non-list content
          flushList()
        }
        
        // Process single line or multi-line paragraph
        const firstLine = lines[0]
        const restLines = lines.slice(1)
        
        // Check if first line is a heading
        const isAllCaps = firstLine === firstLine.toUpperCase() && 
                          firstLine.length > 3 && 
                          firstLine.length < 100 &&
                          /[A-Z]{3,}/.test(firstLine)
        
        const endsWithColon = firstLine.endsWith(':') && firstLine.length < 100
        
        if (isAllCaps) {
          html += `<h3><strong>${firstLine}</strong></h3>\n`
          if (restLines.length > 0) {
            html += `<p>${restLines.join(' ')}</p>\n`
          }
        } else if (endsWithColon) {
          html += `<p><strong>${firstLine}</strong></p>\n`
          if (restLines.length > 0) {
            // Check if rest is a list
            const restIsList = restLines.every(line => /^[•\-\*]\s/.test(line))
            if (restIsList) {
              html += '<ul>\n'
              for (const line of restLines) {
                const cleaned = line.replace(/^[•\-\*]\s+/, '')
                html += `  <li>${cleaned}</li>\n`
              }
              html += '</ul>\n'
            } else {
              html += `<p>${restLines.join(' ')}</p>\n`
            }
          }
        } else {
          // Regular paragraph - join all lines
          html += `<p>${lines.join(' ')}</p>\n`
        }
      }
      
      // Flush any remaining list
      flushList()
      
      // Clean up excessive line breaks
      html = html.replace(/\n{3,}/g, '\n\n')
      
      return html
    }
    
    // Handle text files
    if (fileName.endsWith('.txt')) {
      console.log('[v0] Handling .txt file')
      const text = await file.text()
      console.log('[v0] Extracted text length:', text.length)
      const formatted = formatTextToHTML(text)
      console.log('[v0] Formatted HTML length:', formatted.length)
      return { success: true, content: formatted }
    }
    
    // Handle Word documents (.docx) with mammoth
    if (fileName.endsWith('.docx')) {
      console.log('[v0] Handling .docx file with mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log('[v0] Buffer size:', buffer.length)
      
      // Use mammoth with enhanced options to preserve formatting
      const result = await mammoth.convertToHtml(
        { buffer: buffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h2:fresh",
            "p[style-name='Heading 2'] => h3:fresh",
            "p[style-name='Heading 3'] => h4:fresh",
            "p[style-name='Title'] => h2:fresh",
            "p[style-name='Subtitle'] => h3:fresh",
          ],
          convertImage: mammoth.images.imgElement((image) => {
            // Skip images in JD documents
            return { src: '' }
          }),
          ignoreEmptyParagraphs: true,
        }
      )
      
      console.log('[v0] Mammoth conversion complete, has value:', !!result.value)
      if (result.value) {
        console.log('[v0] Mammoth HTML length:', result.value.length)
        console.log('[v0] Mammoth HTML preview:', result.value.substring(0, 200))
        
        // Clean up the HTML - mammoth sometimes adds extra empty tags
        let cleanedHTML = result.value
          .replace(/<p><\/p>/g, '') // Remove empty paragraphs
          .replace(/<p>\s*<\/p>/g, '')
          .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
        
        // Log any conversion messages/warnings
        if (result.messages.length > 0) {
          console.log('[v0] Mammoth messages:', result.messages.slice(0, 5))
        }
        
        return { success: true, content: cleanedHTML }
      }
      
      return { success: false, error: 'Could not extract content from Word document.' }
    }
    
    // Handle older Word documents (.doc)
    if (fileName.endsWith('.doc')) {
      console.log('[v0] .doc format not supported')
      // .doc format is binary and more complex - suggest converting to .docx or PDF
      return { 
        success: false, 
        error: 'Old .doc format is not fully supported. Please convert to .docx or .pdf, or copy and paste the content directly.' 
      }
    }
    
    // Handle PDF files with pdf-parse (dynamically imported)
    if (fileName.endsWith('.pdf')) {
      console.log('[v0] Handling .pdf file with pdf-parse')
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log('[v0] PDF buffer size:', buffer.length)
      
      try {
        // Dynamically import pdf-parse to avoid build issues with CommonJS module
        const pdfParse = (await import('pdf-parse')).default
        
        // Use pdf-parse with options to maximize text extraction
        const pdfData = await pdfParse(buffer, {
          max: 0, // Extract all pages
          version: 'default'
        })
        
        console.log('[v0] PDF parsed successfully')
        console.log('[v0] - Total pages:', pdfData.numpages)
        console.log('[v0] - Text length:', pdfData.text.length)
        console.log('[v0] - Text preview:', pdfData.text.substring(0, 300))
        
        if (pdfData.text && pdfData.text.trim().length > 0) {
          // Clean up common PDF extraction issues
          let cleanedText = pdfData.text
            // Remove excessive spaces
            .replace(/  +/g, ' ')
            // Fix broken words across lines (hyphenation)
            .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
            // Normalize line breaks (PDF often has weird spacing)
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Remove page numbers and headers/footers (simple patterns)
            .replace(/^\s*\d+\s*$/gm, '')
            .replace(/^Page \d+ of \d+$/gm, '')
          
          console.log('[v0] Cleaned text length:', cleanedText.length)
          console.log('[v0] Cleaned preview:', cleanedText.substring(0, 200))
          
          // Format the extracted text with HTML structure
          const formatted = formatTextToHTML(cleanedText)
          console.log('[v0] Formatted PDF HTML length:', formatted.length)
          console.log('[v0] Formatted HTML preview:', formatted.substring(0, 300))
          
          return { success: true, content: formatted }
        }
        
        console.log('[v0] PDF text extraction resulted in empty content')
        return { success: false, error: 'Could not extract text from PDF. The file may be scanned or image-based. Please try converting to .docx or copy and paste the content directly.' }
      } catch (pdfError: any) {
        console.error('[v0] PDF parsing error:', pdfError)
        return { 
          success: false, 
          error: `Failed to parse PDF: ${pdfError.message || 'Unknown error'}. Please try converting to .docx or copy and paste the content directly.` 
        }
      }
    }
    
    return { success: false, error: 'Unsupported file type. Please use .txt, .docx, or .pdf files.' }
  } catch (error: any) {
    console.error('[v0] Error parsing JD:', error)
    return { success: false, error: error.message || 'Failed to parse document. Please try copying and pasting the content instead.' }
  }
}
