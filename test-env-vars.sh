#!/bin/bash
echo "🧪 Testing Environment Variables"
echo "==============================="

echo "⏰ Wachten op deployment..."
sleep 150

echo "🔍 Testing current DATABASE_URL..."
curl -s https://globalscout-backend-qbyh.onrender.com/api/test-db | jq '.'

echo ""
echo "📊 Analyseer de 'databaseUrl' field in de response"
echo "   - Als het nog steeds :5432 toont, dan overschrijft Render dashboard de render.yaml"
echo "   - Als het :6543 toont, dan werkt de connection pooler niet"
