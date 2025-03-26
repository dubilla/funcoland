#!/bin/bash

# Find all JavaScript files containing getServerSession and update them
FILES=$(grep -l "getServerSession()" --include="*.js*" -r src/ 2>/dev/null)

for file in $FILES; do
  echo "Updating $file"
  # Add import if it doesn't exist
  if ! grep -q "import { authOptions } from '@/lib/auth'" $file; then
    sed -i '' -e '/import.*getServerSession/ a\
import { authOptions } from '"'"'@/lib/auth'"'"';
' $file
  fi
  
  # Update getServerSession calls
  sed -i '' -e 's/getServerSession()/getServerSession(authOptions)/g' $file
done

echo "Auth update complete!"