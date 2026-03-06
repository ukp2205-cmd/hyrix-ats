import { execSync } from 'child_process'
const result = execSync('find / -name "globals.css" -path "*/app/globals.css" 2>/dev/null').toString()
console.log('[v0] Found:', result)
console.log('[v0] CWD:', process.cwd())
