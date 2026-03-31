#!/bin/bash

# Vercel Deploy Script
# Interactive menu for AeroBook environments

# Always run from project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "AeroBook - Environment Deployment"
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

# Environment selection
echo "Select Target Environment:"
echo "1. Production  - Live: https://aerobook.app/"
echo "2. Preview     - Shared: https://preview.aerobook.app/"
echo "3. Development - Hosted: (Manual CLI push)"
echo "4. Local       - Machine: http://localhost:5173"
echo ""

read -p "Select environment (1-4): " env_choice
echo ""

case $env_choice in
    1)
        echo "🚀 Deploying to PRODUCTION..."
        echo "⚠️  This will update the live site at https://aerobook.app/"
        echo ""
        read -p "Are you sure? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            vercel --prod
        else
            echo "Cancelled."
            exit 0
        fi
        ;;
    2)
        echo "🔍 Deploying to PREVIEW..."
        echo "Updates the shared preview environment at https://preview.aerobook.app/"
        echo ""
        vercel
        ;;
    3)
        echo "🛠️  Deploying to DEVELOPMENT..."
        echo "Manual push to Vercel's Development environment"
        echo ""
        # In Vercel CLI, manual pushes are treated as preview deployments
        # but they will use Development variables if configured on Vercel.
        vercel
        ;;
    4)
        echo "💻 Starting LOCAL server..."
        npm run dev
        ;;
    *)
        echo "Invalid option."
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Process Complete!"
echo "=========================================="
echo ""
