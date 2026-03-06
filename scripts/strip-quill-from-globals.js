import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const filePath = join(process.cwd(), 'app', 'globals.css')
console.log('[v0] cwd:', process.cwd())
console.log('[v0] filePath:', filePath)
let css = readFileSync(filePath, 'utf8')

// Remove any remaining @import of quill CDN URLs
css = css.replace(/@import\s+['"]https:\/\/cdn\.quilljs\.com[^'"]*['"]\s*;?\n?/g, '')
css = css.replace(/@import\s+['"]https:\/\/cdn\.jsdelivr\.net\/npm\/quill[^'"]*['"]\s*;?\n?/g, '')

// Remove inlined quill.snow.css blocks — they start with /* Quill Editor Styles */ comment
// and end just before the next section or at end of file
// Strategy: remove everything from the quill comment + @import line through all .ql-* rules
// We identify start by the @import quill line and remove the following .ql-* block

// Split into lines and filter out contiguous .ql-* blocks that follow a quill @import
const lines = css.split('\n')
const out = []
let inQuillBlock = false

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  // Detect start of inlined quill block (the @import line that is now mid-file)
  if (line.includes('cdn.quilljs.com') || line.includes('cdn.jsdelivr.net/npm/quill')) {
    inQuillBlock = true
    continue
  }

  if (inQuillBlock) {
    // Quill CSS lines all start with .ql- or are part of quill blocks
    // Stop the quill block when we hit a non-quill line that looks like app CSS
    // (e.g. a :root, @theme, .hyrix-, /* section comment */, etc.)
    const trimmed = line.trim()
    if (
      trimmed === '' ||
      trimmed.startsWith('.ql-') ||
      trimmed.startsWith('/*!') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('}') ||
      trimmed.startsWith('/*') ||
      /^[.#\[]?ql/.test(trimmed) ||
      /^\s*(overflow|display|position|box|padding|margin|border|color|background|font|width|height|cursor|visibility|content|white-space|float|list|outline|vertical|text|opacity|z-index|transition|word|min-|max-)/.test(trimmed)
    ) {
      // Still in quill block — skip
      continue
    } else {
      // Exited quill block
      inQuillBlock = false
    }
  }

  out.push(line)
}

const result = out.join('\n')
writeFileSync(filePath, result, 'utf8')
console.log(`[v0] Done. Output: ${result.split('\n').length} lines (was ${lines.length})`)
