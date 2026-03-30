#!/bin/bash

# Sync Environment Variables to Vercel
# Reads from local .env.{env} files and pushes VITE_API_URL to Vercel

# Always run from project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "AeroBook - Sync Environment Variables"
echo "=========================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    exit 1
fi

# Check if linked
if [ ! -f .vercel/project.json ]; then
    echo "❌ Not linked to a Vercel project."
    echo "Run: vercel link"
    exit 1
fi

sync_env() {
    local env_file=$1
    local vercel_env=$2
    
    if [ ! -f "$env_file" ]; then
        echo "⚠️  $env_file not found, skipping..."
        return
    fi
    
    echo "Syncing $env_file to Vercel $vercel_env..."
    
    # Extract VITE_API_URL
    local api_url=$(grep -E '^VITE_API_URL=' "$env_file" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -n "$api_url" ]; then
        echo "  VITE_API_URL=$api_url"
        # Remove existing if any (ignore errors)
        vercel env rm VITE_API_URL "$vercel_env" -y 2>/dev/null
        # Add new
        printf '%s' "$api_url" | vercel env add VITE_API_URL "$vercel_env"
        echo "  ✓ Done"
    else
        echo "  ⚠️  VITE_API_URL not found in $env_file"
    fi
    echo ""
}

# Sync all environments
sync_env ".env.development" "development"
sync_env ".env.preview" "preview"
sync_env ".env.production" "production"

echo "=========================================="
echo "Sync Complete!"
echo "=========================================="
echo ""
echo "To view all variables:"
echo "  vercel env ls"
echo ""
