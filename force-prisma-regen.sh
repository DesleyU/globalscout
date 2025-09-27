#!/bin/bash
echo "🔄 Forcing Prisma Client Regeneration"
echo "====================================="

# Verwijder bestaande Prisma client
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

# Regenereer Prisma client
npx prisma generate

# Deploy met force flag
git add .
git commit -m "🔄 Force Prisma client regeneration"
git push origin main

echo "✅ Prisma client regeneration deployed!"
echo "⏰ Wacht 2-3 minuten en test opnieuw"
