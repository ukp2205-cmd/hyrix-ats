import re

path = '/app/globals.css'

with open(path, 'r') as f:
    content = f.read()

original_len = len(content.splitlines())

# Remove any @import lines pointing to quill CDN (mid-file ones)
# Keep only the first two lines: @import "tailwindcss"; and blank line
lines = content.splitlines(keepends=True)

result = []
i = 0
while i < len(lines):
    line = lines[i]
    # Remove mid-file quill CDN @import lines
    if '@import' in line and ('quilljs.com' in line or 'jsdelivr.net/npm/quill' in line):
        print(f'[v0] Removing @import at line {i+1}: {line.strip()}')
        i += 1
        continue
    result.append(line)
    i += 1

new_content = ''.join(result)
new_len = len(new_content.splitlines())

with open(path, 'w') as f:
    f.write(new_content)

print(f'[v0] Done. Lines before: {original_len}, after: {new_len}, removed: {original_len - new_len}')
