#!/bin/bash

# Environment Setup Script for Lean Professional Workflow
# Usage: ./scripts/setup-env.sh [staging|production]

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 [staging|production]"
    exit 1
fi

case "$ENVIRONMENT" in
    "staging")
        cp .env.staging .env.local
        echo "✅ Switched to STAGING environment"
        echo "🌐 Staging URL will be: https://culinova-staging.vercel.app"
        ;;
    "production")
        cp .env.production .env.local
        echo "✅ Switched to PRODUCTION environment"
        echo "🌐 Production URL will be: https://culinova.app"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Usage: $0 [staging|production]"
        exit 1
        ;;
esac

echo "📝 Active environment variables:"
echo "   VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env.local | cut -d'=' -f2)"
echo "   VITE_APP_VARIANT=$(grep VITE_APP_VARIANT .env.local | cut -d'=' -f2)"
echo ""
echo "🚀 Ready to develop with: npm run dev"
