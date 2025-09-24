#!/usr/bin/env node

/**
 * Backend Deployment Script for GlobalScout
 * Supports Railway, Render, DigitalOcean, and other platforms
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 GlobalScout Backend Deployment');
console.log('==================================\n');

// Create Railway deployment configuration
const railwayConfig = {
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
};

fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
console.log('✅ Created railway.json');

// Create Render deployment configuration
const renderConfig = {
  "services": [
    {
      "type": "web",
      "name": "globalscout-backend",
      "env": "node",
      "buildCommand": "cd backend && npm install",
      "startCommand": "cd backend && npm start",
      "healthCheckPath": "/health",
      "envVars": [
        {
          "key": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
};

fs.writeFileSync('render.yaml', `services:
  - type: web
    name: globalscout-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
`);
console.log('✅ Created render.yaml');

// Create Dockerfile for containerized deployment
const dockerfile = `# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
`;

fs.writeFileSync('Dockerfile', dockerfile);
console.log('✅ Created Dockerfile');

// Create docker-compose for local production testing
const dockerCompose = `version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - JWT_SECRET=\${JWT_SECRET}
      - JWT_REFRESH_SECRET=\${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=globalscout
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
`;

fs.writeFileSync('docker-compose.yml', dockerCompose);
console.log('✅ Created docker-compose.yml');

// Create deployment instructions
const deploymentInstructions = `# 🚀 Backend Deployment Options

## 1. Railway (Recommended - Easy & Fast)

1. Install Railway CLI:
   \`\`\`bash
   npm install -g @railway/cli
   \`\`\`

2. Login and deploy:
   \`\`\`bash
   railway login
   railway init
   railway up
   \`\`\`

3. Add environment variables in Railway dashboard:
   - DATABASE_URL (from Supabase)
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - STRIPE_SECRET_KEY
   - etc.

## 2. Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the render.yaml configuration
4. Add environment variables in Render dashboard

## 3. DigitalOcean App Platform

1. Connect your GitHub repository
2. Select Node.js environment
3. Set build command: \`cd backend && npm install\`
4. Set run command: \`cd backend && npm start\`
5. Add environment variables

## 4. Docker Deployment

1. Build and run locally:
   \`\`\`bash
   docker build -t globalscout-backend .
   docker run -p 5000:5000 --env-file backend/.env globalscout-backend
   \`\`\`

2. Or use docker-compose:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

## 5. VPS/Server Deployment

1. Install Node.js, PM2, and Nginx on your server
2. Clone repository and install dependencies
3. Set up environment variables
4. Use PM2 to manage the process:
   \`\`\`bash
   cd backend
   pm2 start npm --name "globalscout-backend" -- start
   pm2 save
   pm2 startup
   \`\`\`

## Environment Variables Required:

- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- NODE_ENV=production
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- (see backend/.env.production.configured for full list)
`;

fs.writeFileSync('BACKEND-DEPLOYMENT.md', deploymentInstructions);
console.log('✅ Created BACKEND-DEPLOYMENT.md');

console.log('\n🎯 Next Steps:');
console.log('1. Choose a hosting platform (Railway recommended for beginners)');
console.log('2. Set up your database (Supabase recommended)');
console.log('3. Configure environment variables');
console.log('4. Deploy using one of the methods above');
console.log('\n📚 Read BACKEND-DEPLOYMENT.md for detailed instructions');