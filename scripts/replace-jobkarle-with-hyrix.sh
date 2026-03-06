#!/bin/bash
# This script replaces all instances of JobKarle with Hyrix

# Replace JobKarle with Hyrix
find app components lib -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/JobKarle/Hyrix/g' {} +

# Replace jobkarle with hyrix (for localStorage keys etc)
find app components lib -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/jobkarle/hyrix/g' {} +

# Replace JK logo with HX
find app components lib -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/>JK</>HX</g' {} +

echo "Replacement complete! JobKarle has been replaced with Hyrix throughout the codebase."
