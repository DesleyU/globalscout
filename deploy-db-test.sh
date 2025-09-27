#!/bin/bash
echo "🚀 Deploying database test endpoint..."
git add .
git commit -m "Add database test endpoint for Render debugging"
git push origin main
echo "✅ Pushed to main - Render will redeploy"
echo "⏳ Wait 2-3 minutes then test:"
echo "curl https://globalscout-backend-qbyh.onrender.com/api/test-db"
