// Simple JSX bracket/paren validator
const fs = require('fs');

const content = fs.readFileSync('app/admin/jobs-new/page.tsx', 'utf8');
const lines = content.split('\n');

let braceStack = [];
let parenStack = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Skip comments and strings (simple approach)
  let cleanLine = line.replace(/\/\/.*$/, '').replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');
  
  for (let i = 0; i < cleanLine.length; i++) {
    const char = cleanLine[i];
    const prevChar = i > 0 ? cleanLine[i-1] : '';
    const nextChar = i < cleanLine.length - 1 ? cleanLine[i+1] : '';
    
    if (char === '{') {
      braceStack.push({ line: lineNum, col: i });
    } else if (char === '}') {
      if (braceStack.length === 0) {
        console.log(`ERROR at line ${lineNum}:${i} - Unexpected closing brace }`);
      } else {
        braceStack.pop();
      }
    } else if (char === '(') {
      parenStack.push({ line: lineNum, col: i });
    } else if (char === ')') {
      if (parenStack.length === 0) {
        console.log(`ERROR at line ${lineNum}:${i} - Unexpected closing paren )`);
      } else {
        const opener = parenStack.pop();
        // Check for )} pattern
        if (nextChar === '}') {
          console.log(`INFO: Found )} at line ${lineNum}:${i}`);
        }
      }
    }
  }
});

if (braceStack.length > 0) {
  console.log(`ERROR: ${braceStack.length} unclosed braces`);
  braceStack.forEach(b => console.log(`  Unclosed { at line ${b.line}`));
}

if (parenStack.length > 0) {
  console.log(`ERROR: ${parenStack.length} unclosed parens`);
  parenStack.forEach(p => console.log(`  Unclosed ( at line ${p.line}`));
}

console.log('\nValidation complete');
