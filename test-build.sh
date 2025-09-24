#!/bin/bash

echo "🧪 Testing Frontend Build"
echo "========================="

cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building for production..."
npm run build

if [ -d "dist" ]; then
    echo "✅ Build successful!"
    echo "📊 Build size:"
    du -sh dist/
    echo ""
    echo "📁 Build contents:"
    ls -la dist/
    echo ""
    echo "🚀 Ready for deployment!"
else
    echo "❌ Build failed!"
    exit 1
fi
