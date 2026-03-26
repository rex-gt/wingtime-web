#!/bin/bash

# Vercel Logs Viewer
# View deployment and runtime logs

# Always run from project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "AeroBook - Vercel Logs"
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

echo "Current project:"
cat .vercel/project.json 2>/dev/null | grep "projectId" | head -1
echo ""

echo "Log Options:"
echo "1. Latest deployment logs"
echo "2. Production deployment logs"
echo "3. Live logs (follow mode)"
echo "4. Build logs only"
echo "5. Runtime logs only"
echo ""

read -p "Select log type (1-5): " log_type
echo ""

case $log_type in
    1)
        echo "Fetching latest deployment logs..."
        echo ""
        # Get the most recent deployment URL
        latest_url=$(vercel ls --limit 1 2>/dev/null | grep -E 'https://' | awk '{print $2}' | head -1)
        if [ -n "$latest_url" ]; then
            vercel logs "$latest_url"
        else
            echo "Could not find latest deployment. Trying default..."
            vercel logs
        fi
        ;;
    2)
        echo "Fetching production deployment logs..."
        echo ""
        # Get the production deployment URL
        # Expect a line containing an https:// deployment URL (e.g., "url: https://...").
        prod_url=$(vercel inspect --prod 2>/dev/null | grep -Eo 'https://[^ ]+' | head -1)
        if [ -n "$prod_url" ]; then
            vercel logs "$prod_url"
        else
            # Fallback: list deployments and find production
            prod_url=$(vercel ls --prod --limit 1 2>/dev/null | grep -E 'https://' | awk '{print $2}' | head -1)
            if [ -n "$prod_url" ]; then
                vercel logs "$prod_url"
            else
                echo "Could not find production deployment URL."
                echo "Try: vercel logs <your-production-url>"
            fi
        fi
        ;;
    3)
        echo "Following live logs (Ctrl+C to stop)..."
        echo ""
        vercel logs --follow
        ;;
    4)
        echo "Fetching build logs..."
        echo ""
        echo "Note: Build logs are shown during deployment."
        echo "Fetching latest deployment info..."
        # Show the latest deployment details which include build info
        # If `vercel inspect` fails (e.g. no active deployment or older CLI behavior),
        # fall back to listing the last 5 deployments so the user can pick one to inspect.
        # Show the latest deployment details which include build info
        vercel inspect 2>/dev/null || vercel ls --limit 5
        ;;
    5)
        echo "Fetching runtime logs..."
        echo ""
        # Runtime logs are the default for vercel logs
        latest_url=$(vercel ls --limit 1 2>/dev/null | grep -E 'https://' | awk '{print $2}' | head -1)
        if [ -n "$latest_url" ]; then
            vercel logs "$latest_url"
        else
            vercel logs
        fi
        ;;
    *)
        echo "Invalid option."
        exit 1
        ;;
esac

echo ""
