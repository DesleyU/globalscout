#!/bin/bash
echo "🚀 Deploying to Render..."
git add .
git commit -m "Fix Render deployment - add missing env vars"
git push origin main
echo "✅ Pushed to main branch - Render will auto-deploy"
echo "⏳ Wait 2-3 minutes for deployment to complete"
echo "🧪 Then test: curl https://globalscout-backend-qbyh.onrender.com/health"
