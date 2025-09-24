#!/usr/bin/env node

/**
 * Frontend Deployment Script for GlobalScout
 * Supports Vercel, Netlify, Cloudflare Pages, and other platforms
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 GlobalScout Frontend Deployment');
console.log('===================================\n');

// Create Vercel configuration
const vercelConfig = {
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install"
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log('✅ Created vercel.json');

// Create Netlify configuration
const netlifyConfig = `[build]
  base = "frontend/"
  command = "npm run build"
  publish = "dist/"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`;

fs.writeFileSync('netlify.toml', netlifyConfig);
console.log('✅ Created netlify.toml');

// Create Cloudflare Pages configuration
const cloudflareConfig = {
  "production": {
    "command": "cd frontend && npm run build",
    "cwd": "frontend",
    "destination_dir": "dist"
  },
  "preview": {
    "command": "cd frontend && npm run build",
    "cwd": "frontend", 
    "destination_dir": "dist"
  }
};

fs.writeFileSync('wrangler.toml', `name = "globalscout-frontend"
compatibility_date = "2023-12-01"

[env.production]
route = "your-domain.com/*"

[env.preview]
route = "preview.your-domain.com/*"

[[pages_build_output_dir]]
directory = "frontend/dist"
`);
console.log('✅ Created wrangler.toml');

// Create GitHub Actions workflow for automated deployment
const githubWorkflow = `name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: cd frontend && npm ci
    
    - name: Build frontend
      run: cd frontend && npm run build
      env:
        VITE_API_URL: \${{ secrets.VITE_API_URL }}
        VITE_STRIPE_PUBLISHABLE_KEY: \${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.ORG_ID }}
        vercel-project-id: \${{ secrets.PROJECT_ID }}
        working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: cd backend && npm ci
    
    - name: Generate Prisma Client
      run: cd backend && npx prisma generate
    
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway deploy
      env:
        RAILWAY_TOKEN: \${{ secrets.RAILWAY_TOKEN }}
`;

// Create .github/workflows directory if it doesn't exist
if (!fs.existsSync('.github')) {
  fs.mkdirSync('.github');
}
if (!fs.existsSync('.github/workflows')) {
  fs.mkdirSync('.github/workflows');
}

fs.writeFileSync('.github/workflows/deploy.yml', githubWorkflow);
console.log('✅ Created .github/workflows/deploy.yml');

// Create deployment instructions
const frontendInstructions = `# 🎨 Frontend Deployment Options

## 1. Vercel (Recommended - Best for React/Vite)

### Quick Deploy:
1. Install Vercel CLI:
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. Deploy:
   \`\`\`bash
   cd frontend
   vercel
   \`\`\`

3. Set environment variables in Vercel dashboard:
   - VITE_API_URL
   - VITE_STRIPE_PUBLISHABLE_KEY

### GitHub Integration:
1. Connect your repository to Vercel
2. Set build settings:
   - Framework: Vite
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist

## 2. Netlify

### Drag & Drop:
1. Build locally: \`cd frontend && npm run build\`
2. Drag the \`dist\` folder to Netlify

### Git Integration:
1. Connect your repository to Netlify
2. Set build settings:
   - Base directory: frontend
   - Build command: npm run build
   - Publish directory: frontend/dist

## 3. Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set build settings:
   - Build command: cd frontend && npm run build
   - Build output directory: frontend/dist

## 4. GitHub Pages

1. Enable GitHub Pages in repository settings
2. Use GitHub Actions workflow (already created)
3. Set repository secrets for environment variables

## 5. Static File Server

1. Build the project:
   \`\`\`bash
   cd frontend
   npm run build
   \`\`\`

2. Serve the \`dist\` folder with any web server:
   - Nginx
   - Apache
   - Caddy
   - Express.js static server

## Environment Variables Required:

- VITE_API_URL (your backend URL)
- VITE_STRIPE_PUBLISHABLE_KEY
- VITE_CDN_URL (optional)

## Custom Domain Setup:

1. Add CNAME record: www.yourdomain.com → your-app.vercel.app
2. Add A record: yourdomain.com → hosting provider IP
3. Configure SSL (usually automatic with modern hosts)

## Performance Optimization:

- All assets are automatically optimized by Vite
- Gzip/Brotli compression enabled
- CDN distribution included with most hosts
- Browser caching headers configured
`;

fs.writeFileSync('FRONTEND-DEPLOYMENT.md', frontendInstructions);
console.log('✅ Created FRONTEND-DEPLOYMENT.md');

// Create a simple deployment test script
const testScript = `#!/bin/bash

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
`;

fs.writeFileSync('test-build.sh', testScript);
fs.chmodSync('test-build.sh', '755');
console.log('✅ Created test-build.sh');

console.log('\n🎯 Next Steps:');
console.log('1. Choose a hosting platform (Vercel recommended)');
console.log('2. Set up environment variables');
console.log('3. Deploy using one of the methods above');
console.log('4. Configure custom domain (optional)');
console.log('\n📚 Read FRONTEND-DEPLOYMENT.md for detailed instructions');
console.log('\n🧪 Test your build: ./test-build.sh');