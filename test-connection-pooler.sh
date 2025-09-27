#!/bin/bash
echo "🔄 Testing Supabase Connection Pooler (Port 6543)..."
cp render-test-1.yaml render.yaml
git add render.yaml
git commit -m "Test Supabase connection pooler (port 6543)"
git push origin main
echo "✅ Deployed connection pooler test"
echo "⏳ Wait 2-3 minutes then test:"
echo "curl https://globalscout-backend-qbyh.onrender.com/api/test-db"
