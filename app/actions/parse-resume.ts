'use server'

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import nlp from 'compromise'

interface ParsedResumeData {
  name?: string
  email?: string
  mobile_number?: string
  current_location?: string
  preferred_location?: string
  skills?: string
  industry?: string
  experience_years?: string
  current_ctc?: string
  expected_ctc?: string
  notice_period?: string
}

interface ExtractionResult {
  name: string | null
  email: string | null
  phone: string | null
  confidence: {
    name: number
    email: number
    phone: number
  }
}

// ============================================================
// TEXT EXTRACTION LAYER
// ============================================================

/**
 * Extract text from PDF using buffer parsing
 * Lightweight approach that works in serverless environments
 * Extracts readable text without native dependencies
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('[v0] PDF Extraction: Starting with buffer parsing...')
    
    // Convert buffer to string and extract text content
    // PDF files contain text streams that can be extracted
    const pdfText = buffer.toString('binary')
    
    // Extract text between stream markers
    // PDFs store text in content streams marked by specific delimiters
    const textMatches = pdfText.match(/\((.*?)\)/g) || []
    
    let extractedText = ''
    for (const match of textMatches) {
      // Remove parentheses and clean up
      const text = match.replace(/[()]/g, '')
      
      // Skip binary data and control characters
      if (/^[\x20-\x7E\s]+$/.test(text) && text.length > 2) {
        extractedText += text + ' '
      }
    }
    
    // Also try to extract text from stream objects
    const streamPattern = /stream\s*\n([\s\S]*?)\nendstream/g
    let streamMatch
    while ((streamMatch = streamPattern.exec(pdfText)) !== null) {
      const streamContent = streamMatch[1]
      // Extract readable text from stream
      const readableText = streamContent.match(/[A-Za-z0-9\s@.\-+()]+/g)
      if (readableText) {
        extractedText += readableText.join(' ') + ' '
      }
    }
    
    // Clean up extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\s]/g, ' ')
      .trim()
    
    console.log('[v0] PDF Extraction: SUCCESS -', extractedText.length, 'characters extracted')
    
    return extractedText
  } catch (error) {
    console.error('[v0] PDF Extraction: FAILED -', error)
    return ''
  }
}

/**
 * Extract text from DOCX using mammoth
 * Industry standard for DOCX parsing
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    console.log('[v0] DOCX Extraction: Starting...')
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    console.log('[v0] DOCX Extraction: SUCCESS -', result.value.length, 'characters')
    return result.value
  } catch (error) {
    console.error('[v0] DOCX Extraction: FAILED -', error)
    return ''
  }
}

/**
 * Extract text from legacy DOC files
 * Basic extraction with binary cleanup
 */
async function extractTextFromDOC(buffer: Buffer): Promise<string> {
  try {
    console.log('[v0] DOC Extraction: Starting...')
    const text = buffer.toString('utf8')
    const cleaned = text
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/[^\x20-\x7E\n\r\u00A0-\uFFFF]/g, ' ')
      .replace(/\s{3,}/g, '\n')
      .trim()
    
    console.log('[v0] DOC Extraction: SUCCESS -', cleaned.length, 'characters')
    return cleaned
  } catch (error) {
    console.error('[v0] DOC Extraction: FAILED -', error)
    return ''
  }
}

// ============================================================
// TEXT NORMALIZATION
// ============================================================

/**
 * Normalize extracted text for consistent parsing
 * Handles messy resume formatting, bullets, extra whitespace
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '\n') // Normalize line endings
    .replace(/\n{2,}/g, '\n') // Remove multiple newlines
    .replace(/[•●▪]/g, ' ') // Replace bullets with space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// ============================================================
// PASS 1: NLP-BASED NAME EXTRACTION (COMPROMISE)
// ============================================================

/**
 * Extract candidate name using NLP (Named Entity Recognition)
 * Uses compromise library for PERSON entity detection
 */
function extractNameUsingNLP(text: string): { name: string | null; confidence: number } {
  console.log('[v0] NAME PASS 1: NLP-based extraction starting...')
  
  try {
    const doc = nlp(text)
    const people = doc.people().out('array') as string[]
    
    console.log('[v0] NAME PASS 1: Found', people.length, 'person entities')
    
    if (people.length === 0) {
      return { name: null, confidence: 0 }
    }
    
    // Strategy: Prefer names from top 10 lines (resume header)
    const topLines = text.split('\n').slice(0, 10).join('\n')
    const topDoc = nlp(topLines)
    const topPeople = topDoc.people().out('array') as string[]
    
    if (topPeople.length > 0) {
      const candidateName = topPeople[0]
      
      // Validate: 2-4 words, reasonable length, proper capitalization
      const words = candidateName.split(/\s+/)
      if (words.length >= 2 && words.length <= 4 && candidateName.length < 50) {
        // Check if words are properly capitalized (not ALL CAPS)
        const isProperlyCapitalized = !candidateName.match(/^[A-Z\s]+$/)
        
        if (isProperlyCapitalized) {
          console.log('[v0] NAME PASS 1: SUCCESS -', candidateName, '(confidence: 90%)')
          return { name: candidateName, confidence: 90 }
        }
      }
    }
    
    // Fallback: Use first valid person entity from entire document
    for (const person of people) {
      const words = person.split(/\s+/)
      if (words.length >= 2 && words.length <= 4 && person.length < 50) {
        const isProperlyCapitalized = !person.match(/^[A-Z\s]+$/)
        if (isProperlyCapitalized) {
          console.log('[v0] NAME PASS 1: SUCCESS (fallback) -', person, '(confidence: 70%)')
          return { name: person, confidence: 70 }
        }
      }
    }
    
    console.log('[v0] NAME PASS 1: No valid name found')
    return { name: null, confidence: 0 }
  } catch (error) {
    console.error('[v0] NAME PASS 1: ERROR -', error)
    return { name: null, confidence: 0 }
  }
}

// ============================================================
// PASS 2: REGEX-BASED NAME EXTRACTION (FALLBACK)
// ============================================================

/**
 * Extract name using pattern matching as fallback
 * Only used if NLP fails
 */
function extractNameUsingRegex(text: string): { name: string | null; confidence: number } {
  console.log('[v0] NAME PASS 2: Regex-based extraction starting...')
  
  const lines = text.split('\n').filter(l => l.trim())
  
  // Check first 10 lines for name patterns
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim()
    
    // Skip lines with common resume keywords
    if (/@|phone|mobile|email|resume|curriculum|vitae|objective|summary|experience|education|skills/i.test(line)) {
      continue
    }
    
    // Skip lines with numbers (4+ digits) or job titles
    if (/\d{4,}/.test(line)) continue
    if (/(engineer|developer|manager|analyst|consultant|designer|architect|specialist|director)/i.test(line)) continue
    
    const words = line.split(/\s+/)
    
    // Name validation: 2-4 words, reasonable length
    if (words.length >= 2 && words.length <= 4 && line.length >= 4 && line.length < 50) {
      // Check capitalization pattern
      const looksLikeName = words.every(w => {
        return /^[A-Z][a-z]*(?:'[A-Z][a-z]*)?$/i.test(w) || /^[A-Z]\.?$/.test(w)
      })
      
      // Reject ALL CAPS
      const notAllCaps = !line.match(/^[A-Z\s]+$/)
      
      if (looksLikeName && notAllCaps) {
        const name = words.join(' ')
        console.log('[v0] NAME PASS 2: SUCCESS -', name, '(confidence: 60%)')
        return { name, confidence: 60 }
      }
    }
  }
  
  // Pattern: "Name: John Doe"
  const namePattern = /(?:Name|Full Name|Candidate Name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i
  const nameMatch = text.match(namePattern)
  if (nameMatch) {
    console.log('[v0] NAME PASS 2: SUCCESS (pattern match) -', nameMatch[1], '(confidence: 70%)')
    return { name: nameMatch[1], confidence: 70 }
  }
  
  console.log('[v0] NAME PASS 2: No name found')
  return { name: null, confidence: 0 }
}

// ============================================================
// PHONE NUMBER EXTRACTION WITH VALIDATION
// ============================================================

/**
 * Extract and validate phone number using libphonenumber-js
 * Industry standard for phone number validation
 */
function extractAndValidatePhone(text: string): { phone: string | null; confidence: number } {
  console.log('[v0] PHONE EXTRACTION: Starting...')
  
  // Remove common false positives
  let cleanText = text
    .replace(/\d{4}-\d{2}-\d{2}/g, '') // dates (YYYY-MM-DD)
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // dates (DD/MM/YYYY)
    .replace(/\b\d{6}\b/g, '') // PIN codes
  
  // Phone number patterns (prioritized by context)
  const patterns = [
    // Pattern 1: With context keywords (highest confidence)
    { regex: /(?:phone|mobile|contact|tel|call|whatsapp|cell|ph)[:\s]*([+\d\s\-()]{10,15})/gi, priority: 1 },
    // Pattern 2: Indian format with +91
    { regex: /\+91[\s-]?(\d{5})[\s-]?(\d{5})/g, priority: 2 },
    { regex: /\+91[\s-]?(\d{10})/g, priority: 2 },
    // Pattern 3: 10-digit starting with 6-9
    { regex: /\b([6-9]\d{9})\b/g, priority: 3 },
  ]
  
  const candidates: Array<{ number: string; priority: number; context: string }> = []
  
  for (const pattern of patterns) {
    const matches = [...cleanText.matchAll(pattern.regex)]
    for (const match of matches) {
      const rawNumber = match[1] || match[0]
      const digits = rawNumber.replace(/[^\d]/g, '')
      
      // Must be exactly 10 digits starting with 6-9
      if (digits.length === 10 && /^[6-9]/.test(digits)) {
        // Extract surrounding context
        const contextStart = Math.max(0, match.index! - 40)
        const contextEnd = Math.min(cleanText.length, match.index! + 60)
        const context = cleanText.substring(contextStart, contextEnd).toLowerCase()
        
        // Skip false positives
        if (!/percent|score|marks|gpa|cgpa|percentage|grade|employee|emp\s*id|pin|postal|zip/i.test(context)) {
          candidates.push({
            number: digits,
            priority: pattern.priority,
            context: context,
          })
        }
      }
    }
  }
  
  console.log('[v0] PHONE EXTRACTION: Found', candidates.length, 'candidates')
  
  // Sort by priority (lower is better)
  candidates.sort((a, b) => a.priority - b.priority)
  
  // Validate candidates using libphonenumber-js
  for (const candidate of candidates) {
    try {
      const phoneNumber = '+91' + candidate.number
      
      if (isValidPhoneNumber(phoneNumber, 'IN')) {
        const parsed = parsePhoneNumber(phoneNumber, 'IN')
        const formatted = parsed.format('E.164')
        
        // Calculate confidence based on priority
        const confidence = candidate.priority === 1 ? 95 : candidate.priority === 2 ? 90 : 85
        
        console.log('[v0] PHONE EXTRACTION: SUCCESS -', formatted, `(confidence: ${confidence}%)`)
        return { phone: formatted, confidence }
      }
    } catch (error) {
      // Skip invalid candidates
      continue
    }
  }
  
  console.log('[v0] PHONE EXTRACTION: No valid phone found')
  return { phone: null, confidence: 0 }
}

// ============================================================
// EMAIL EXTRACTION
// ============================================================

/**
 * Extract email address using regex
 * Email detection is straightforward and highly reliable
 */
function extractEmail(text: string): { email: string | null; confidence: number } {
  console.log('[v0] EMAIL EXTRACTION: Starting...')
  
  const emailPattern = /\b([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)\b/
  const match = text.match(emailPattern)
  
  if (match) {
    // Validate email format
    const email = match[1]
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    
    if (isValid) {
      console.log('[v0] EMAIL EXTRACTION: SUCCESS -', email, '(confidence: 100%)')
      return { email, confidence: 100 }
    }
  }
  
  console.log('[v0] EMAIL EXTRACTION: No email found')
  return { email: null, confidence: 0 }
}

// ============================================================
// MULTI-PASS EXTRACTION PIPELINE
// ============================================================

/**
 * Execute multi-pass extraction strategy
 * Pass 1: NLP-based name extraction
 * Pass 2: Regex fallback for name
 * Pass 3: Phone validation with libphonenumber-js
 * Pass 4: Email extraction
 */
function executeMultiPassExtraction(text: string): ExtractionResult {
  console.log('[v0] ========== MULTI-PASS EXTRACTION PIPELINE ==========')
  
  const result: ExtractionResult = {
    name: null,
    email: null,
    phone: null,
    confidence: { name: 0, email: 0, phone: 0 },
  }
  
  // PASS 1: NLP-based name extraction
  const nlpName = extractNameUsingNLP(text)
  if (nlpName.name && nlpName.confidence > 0) {
    result.name = nlpName.name
    result.confidence.name = nlpName.confidence
    console.log('[v0] ✓ Name extracted via NLP (Pass 1)')
  }
  
  // PASS 2: Regex fallback if NLP failed
  if (!result.name) {
    const regexName = extractNameUsingRegex(text)
    if (regexName.name) {
      result.name = regexName.name
      result.confidence.name = regexName.confidence
      console.log('[v0] ✓ Name extracted via Regex (Pass 2 - Fallback)')
    }
  }
  
  // PASS 3: Phone extraction with validation
  const phoneResult = extractAndValidatePhone(text)
  if (phoneResult.phone) {
    result.phone = phoneResult.phone
    result.confidence.phone = phoneResult.confidence
    console.log('[v0] ✓ Phone extracted and validated')
  }
  
  // PASS 4: Email extraction
  const emailResult = extractEmail(text)
  if (emailResult.email) {
    result.email = emailResult.email
    result.confidence.email = emailResult.confidence
    console.log('[v0] ✓ Email extracted')
  }
  
  console.log('[v0] ========== EXTRACTION COMPLETE ==========')
  console.log('[v0] Results:', {
    name: result.name || 'NOT FOUND',
    email: result.email || 'NOT FOUND',
    phone: result.phone || 'NOT FOUND',
    confidence: result.confidence,
  })
  
  return result
}

// ============================================================
// SECONDARY FIELDS EXTRACTION
// ============================================================

function extractSecondaryFields(text: string): Partial<ParsedResumeData> {
  const data: Partial<ParsedResumeData> = {}
  
  // Skills extraction
  const skillsPatterns = [
    /(?:Skills?|Technical Skills?|Core Competencies|Key Skills?)[:\s]*\n?([^\n]+(?:\n[^\n]+){0,5})/i,
    /(?:Technologies?|Tools?)[:\s]*\n?([^\n]+)/i,
  ]
  for (const pattern of skillsPatterns) {
    const match = text.match(pattern)
    if (match) {
      data.skills = match[1]
        .replace(/\n/g, ', ')
        .replace(/\s+/g, ' ')
        .replace(/[•\-]/g, ',')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 10)
        .join(', ')
      break
    }
  }
  
  // Experience extraction
  const expPatterns = [
    /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i,
    /(?:Experience|Exp)[:\s]*(\d+)\+?\s*(?:years?|yrs?)/i,
  ]
  for (const pattern of expPatterns) {
    const match = text.match(pattern)
    if (match) {
      data.experience_years = match[1]
      break
    }
  }
  
  // Location extraction
  const locationPatterns = [
    /(?:Location|City|Address)[:\s]+([A-Za-z\s,]+?)(?:\n|$)/i,
    /\b(Mumbai|Delhi|Bangalore|Bengaluru|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Jaipur|Noida|Gurgaon|Gurugram)\b/i,
  ]
  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match) {
      data.current_location = match[1].trim().split('\n')[0]
      break
    }
  }
  
  // CTC extraction
  const ctcPatterns = [
    /(?:Current CTC|CTC|Salary)[:\s]+(\d+(?:\.\d+)?)\s*(?:LPA|Lakhs?|L)/i,
  ]
  for (const pattern of ctcPatterns) {
    const match = text.match(pattern)
    if (match) {
      data.current_ctc = match[1] + ' LPA'
      break
    }
  }
  
  // Notice period extraction
  const noticePatterns = [
    /(?:Notice Period|Notice)[:\s]+(\d+)\s*(?:days?|months?|weeks?)/i,
    /(?:Immediate|Immediately)/i,
  ]
  for (const pattern of noticePatterns) {
    const match = text.match(pattern)
    if (match) {
      data.notice_period = match[0]
      break
    }
  }
  
  return data
}

// ============================================================
// MAIN RESUME PARSER FUNCTION
// ============================================================

export async function parseResume(
  formData: FormData
): Promise<{ success: boolean; data?: ParsedResumeData; error?: string }> {
  try {
    console.log('[v0] ========================================')
    console.log('[v0] RESUME PARSING STARTED')
    console.log('[v0] ========================================')
    
    const file = formData.get('file') as File
    
    if (!file) {
      return { success: false, error: 'No file provided' }
    }
    
    console.log('[v0] File:', file.name, '|', file.type, '|', file.size, 'bytes')
    
    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // TEXT EXTRACTION PHASE
    console.log('[v0] ======== TEXT EXTRACTION PHASE ========')
    
    let text = ''
    const fileName = file.name.toLowerCase()
    
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      text = await extractTextFromPDF(buffer)
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      text = await extractTextFromDOCX(buffer)
    } else if (file.type === 'application/msword' || fileName.endsWith('.doc')) {
      text = await extractTextFromDOC(buffer)
    } else {
      text = await file.text()
      console.log('[v0] Text Extraction: Plain text -', text.length, 'characters')
    }
    
    // Validate extraction quality
    if (!text || text.length < 30) {
      console.log('[v0] TEXT EXTRACTION: FAILED - Insufficient text')
      return {
        success: false,
        error: 'Could not extract text from resume. File may be corrupted or scanned.',
      }
    }
    
    console.log('[v0] TEXT EXTRACTION: SUCCESS -', text.length, 'characters')
    console.log('[v0] First 200 chars:', text.substring(0, 200).replace(/\n/g, ' '))
    
    // TEXT NORMALIZATION PHASE
    console.log('[v0] ======== TEXT NORMALIZATION ========')
    const normalizedText = normalizeText(text)
    console.log('[v0] Normalized text length:', normalizedText.length, 'characters')
    
    // CRITICAL FIELDS EXTRACTION PHASE
    console.log('[v0] ======== CRITICAL FIELDS EXTRACTION ========')
    const extractionResult = executeMultiPassExtraction(normalizedText)
    
    // Build final parsed data
    const parsedData: ParsedResumeData = {
      name: extractionResult.name || undefined,
      email: extractionResult.email || undefined,
      mobile_number: extractionResult.phone || undefined,
    }
    
    // SECONDARY FIELDS EXTRACTION
    console.log('[v0] ======== SECONDARY FIELDS EXTRACTION ========')
    const secondaryFields = extractSecondaryFields(normalizedText)
    Object.assign(parsedData, secondaryFields)
    
    // Log final results
    console.log('[v0] ========================================')
    console.log('[v0] FINAL PARSED DATA:')
    console.log('[v0]   Name:', parsedData.name || 'NOT FOUND', `(${extractionResult.confidence.name}%)`)
    console.log('[v0]   Email:', parsedData.email || 'NOT FOUND', `(${extractionResult.confidence.email}%)`)
    console.log('[v0]   Phone:', parsedData.mobile_number || 'NOT FOUND', `(${extractionResult.confidence.phone}%)`)
    console.log('[v0]   Skills:', parsedData.skills || 'NOT FOUND')
    console.log('[v0]   Experience:', parsedData.experience_years || 'NOT FOUND')
    console.log('[v0]   Location:', parsedData.current_location || 'NOT FOUND')
    console.log('[v0] ========================================')
    
    // Success if we extracted at least one critical field
    const criticalFieldsFound = [parsedData.name, parsedData.email, parsedData.mobile_number].filter(
      Boolean
    ).length
    
    if (criticalFieldsFound === 0) {
      return {
        success: false,
        error: 'Could not extract name, email, or phone. Please fill manually.',
      }
    }
    
    return {
      success: true,
      data: parsedData,
      error: criticalFieldsFound < 3 ? 'Some fields could not be extracted. Please verify.' : undefined,
    }
  } catch (error) {
    console.error('[v0] RESUME PARSING: FATAL ERROR -', error)
    return {
      success: false,
      error: 'Failed to parse resume. Please fill manually.',
    }
  }
}
