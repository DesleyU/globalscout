#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * Configures environment variables and production settings
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔧 Production Environment Setup for GlobalScout');
console.log('===============================================');

// Generate secure random string
function generateSecureSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

// Generate JWT secrets
function generateJWTSecrets() {
    return {
        JWT_SECRET: generateSecureSecret(32),
        JWT_REFRESH_SECRET: generateSecureSecret(32),
        SESSION_SECRET: generateSecureSecret(32),
        HEALTH_CHECK_TOKEN: generateSecureSecret(16)
    };
}

// Create production environment file
function createProductionEnv() {
    console.log('\n🔐 Generating secure secrets...');
    const secrets = generateJWTSecrets();
    
    console.log('✅ Generated secure JWT and session secrets');
    
    // Read template
    const templatePath = 'backend/.env.production';
    if (!fs.existsSync(templatePath)) {
        console.error('❌ Production template not found!');
        process.exit(1);
    }
    
    let envContent = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholder secrets
    envContent = envContent.replace(
        'JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters-long"',
        `JWT_SECRET="${secrets.JWT_SECRET}"`
    );
    
    envContent = envContent.replace(
        'JWT_REFRESH_SECRET="your-super-secure-refresh-secret-minimum-32-characters-long"',
        `JWT_REFRESH_SECRET="${secrets.JWT_REFRESH_SECRET}"`
    );
    
    envContent = envContent.replace(
        'SESSION_SECRET="your-session-secret-minimum-32-characters-long"',
        `SESSION_SECRET="${secrets.SESSION_SECRET}"`
    );
    
    envContent = envContent.replace(
        'HEALTH_CHECK_TOKEN="your-health-check-token"',
        `HEALTH_CHECK_TOKEN="${secrets.HEALTH_CHECK_TOKEN}"`
    );
    
    // Write to .env.production.configured
    const outputPath = 'backend/.env.production.configured';
    fs.writeFileSync(outputPath, envContent);
    
    console.log(`✅ Production environment created: ${outputPath}`);
    
    return secrets;
}

// Create frontend production environment
function createFrontendProductionEnv() {
    console.log('\n🎨 Setting up frontend production environment...');
    
    const frontendEnvContent = `# Frontend Production Environment
# Vite environment variables must be prefixed with VITE_

# API Configuration
VITE_API_URL=https://api.your-domain.com
VITE_API_TIMEOUT=10000

# Stripe Configuration (Public keys only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# Environment
VITE_NODE_ENV=production
VITE_APP_VERSION=1.0.0

# CDN/Assets
VITE_CDN_URL=https://cdn.your-domain.com
VITE_ASSETS_URL=https://assets.your-domain.com
`;

    const frontendEnvPath = 'frontend/.env.production';
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    
    console.log('✅ Frontend production environment created');
}

// Create deployment checklist
function createDeploymentChecklist(secrets) {
    console.log('\n📋 Creating deployment checklist...');
    
    const checklist = `# 🚀 GlobalScout Production Deployment Checklist

## ✅ Pre-deployment Setup

### 1. Database Setup
- [ ] PostgreSQL database created
- [ ] Database URL configured in .env
- [ ] Database migrations applied: \`npx prisma migrate deploy\`
- [ ] Database seeded (optional): \`npm run seed\`

### 2. Environment Configuration
- [ ] Backend .env configured with production values
- [ ] Frontend .env.production configured
- [ ] All secrets generated and secure
- [ ] API keys configured (Stripe, API-Football, etc.)

### 3. Security Configuration
- [ ] JWT secrets configured (✅ Generated automatically)
- [ ] CORS origins configured for your domain
- [ ] Rate limiting configured
- [ ] HTTPS/SSL certificates ready

### 4. External Services
- [ ] Stripe account configured (live keys)
- [ ] Email service configured (SMTP)
- [ ] CDN configured (optional)
- [ ] Monitoring service configured (Sentry, optional)

## 🔧 Generated Secrets (Keep Secure!)

\`\`\`
JWT_SECRET: ${secrets.JWT_SECRET}
JWT_REFRESH_SECRET: ${secrets.JWT_REFRESH_SECRET}
SESSION_SECRET: ${secrets.SESSION_SECRET}
HEALTH_CHECK_TOKEN: ${secrets.HEALTH_CHECK_TOKEN}
\`\`\`

## 🌐 Domain Configuration

### Backend (API)
- Domain: \`api.your-domain.com\`
- Port: 5000 (or configured port)
- Health check: \`https://api.your-domain.com/health\`

### Frontend
- Domain: \`your-domain.com\`
- CDN: \`cdn.your-domain.com\` (optional)

## 📦 Deployment Commands

### Backend Deployment
\`\`\`bash
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm start
\`\`\`

### Frontend Deployment
\`\`\`bash
cd frontend
npm install
npm run build
# Serve dist/ folder with nginx/apache
\`\`\`

## 🔍 Post-deployment Verification

- [ ] Backend health check responds: \`curl https://api.your-domain.com/health\`
- [ ] Frontend loads correctly
- [ ] User registration/login works
- [ ] Payment flow works (test mode first)
- [ ] Database connections stable
- [ ] SSL certificates valid

## 🚨 Emergency Rollback

If issues occur:
1. Revert to previous deployment
2. Check logs: \`pm2 logs\` or server logs
3. Verify database integrity
4. Contact support if needed

## 📞 Support Contacts

- Database: [Your DB provider support]
- Hosting: [Your hosting provider support]
- Domain: [Your domain registrar support]
- SSL: [Your SSL provider support]
`;

    fs.writeFileSync('DEPLOYMENT-CHECKLIST.md', checklist);
    console.log('✅ Deployment checklist created: DEPLOYMENT-CHECKLIST.md');
}

// Main setup function
function setupProduction() {
    console.log('\n🚀 Starting production environment setup...');
    
    // Check if we're in the right directory
    if (!fs.existsSync('backend') || !fs.existsSync('frontend')) {
        console.error('❌ Error: Please run this script from the project root directory');
        process.exit(1);
    }
    
    // Create production environments
    const secrets = createProductionEnv();
    createFrontendProductionEnv();
    createDeploymentChecklist(secrets);
    
    console.log('\n🎉 Production environment setup completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. 📝 Review and edit backend/.env.production.configured');
    console.log('2. 📝 Review and edit frontend/.env.production');
    console.log('3. 🔄 Copy .env.production.configured to .env when ready');
    console.log('4. 🗄️  Set up PostgreSQL database');
    console.log('5. 📋 Follow DEPLOYMENT-CHECKLIST.md');
    
    console.log('\n⚠️  Important Security Notes:');
    console.log('- Keep your .env files secure and never commit them to git');
    console.log('- Use environment variables in production hosting');
    console.log('- Regularly rotate your secrets');
    console.log('- Enable 2FA on all external services');
}

// Run the setup
setupProduction();