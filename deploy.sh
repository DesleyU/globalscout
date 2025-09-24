#!/bin/bash

# GlobalScout Production Deployment Script
# This script helps set up the production environment

echo "🚀 GlobalScout Production Deployment Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "❌ Expected to find 'backend' and 'frontend' directories"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo "📋 Checking required tools..."
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Setup backend environment
echo ""
echo "🔧 Setting up backend environment..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating backend .env file from production template..."
    cp .env.production .env
    echo "⚠️  Please edit backend/.env with your actual production values"
else
    echo "✅ Backend .env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install --production

# Setup database
echo "🗄️  Setting up database..."
if [ -f ".env" ]; then
    echo "📝 Generating Prisma client..."
    npx prisma generate
    
    echo "⚠️  To migrate database, run: npx prisma migrate deploy"
    echo "⚠️  To seed database, run: npm run seed"
else
    echo "⚠️  Please configure .env first, then run: npx prisma migrate deploy"
fi

# Go back to root
cd ..

# Setup frontend environment
echo ""
echo "🎨 Setting up frontend environment..."
cd frontend

if [ ! -f ".env.production" ]; then
    echo "📝 Creating frontend .env.production file..."
    cp ../.env.production .env.production
    echo "⚠️  Please edit frontend/.env.production with your actual production values"
else
    echo "✅ Frontend .env.production file already exists"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend for production
echo "🏗️  Building frontend for production..."
npm run build

echo ""
echo "✅ Production setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your actual production values"
echo "2. Edit frontend/.env.production with your actual production values"
echo "3. Set up your PostgreSQL database"
echo "4. Run: cd backend && npx prisma migrate deploy"
echo "5. Run: cd backend && npm run seed (optional)"
echo "6. Start backend: cd backend && npm start"
echo "7. Serve frontend build files with a web server (nginx, apache, etc.)"
echo ""
echo "🔗 Useful commands:"
echo "- Test servers: node test-servers.js"
echo "- Backend logs: cd backend && npm start"
echo "- Frontend dev: cd frontend && npm run dev"
echo ""
echo "📚 Documentation: Check README.md for detailed setup instructions"