#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Render Deployment Configuration...\n');

// Check if render.yaml exists and is configured correctly
function checkRenderYaml() {
    const renderYamlPath = path.join(__dirname, '..', 'render.yaml');
    
    if (!fs.existsSync(renderYamlPath)) {
        console.log('❌ render.yaml not found');
        return false;
    }
    
    const content = fs.readFileSync(renderYamlPath, 'utf8');
    
    // Check for Supabase DATABASE_URL
    if (content.includes('db.pxiwcdsrkehxgguqyjur.supabase.co')) {
        console.log('✅ render.yaml configured with Supabase DATABASE_URL');
    } else {
        console.log('❌ render.yaml missing Supabase DATABASE_URL');
        return false;
    }
    
    // Check for required environment variables
    const requiredEnvVars = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET', 
        'SESSION_SECRET',
        'FRONTEND_URL'
    ];
    
    let allEnvVarsPresent = true;
    requiredEnvVars.forEach(envVar => {
        if (content.includes(envVar)) {
            console.log(`✅ ${envVar} configured`);
        } else {
            console.log(`❌ ${envVar} missing`);
            allEnvVarsPresent = false;
        }
    });
    
    return allEnvVarsPresent;
}

// Check package.json build script
function checkPackageJson() {
    const packageJsonPath = path.join(__dirname, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        console.log('❌ package.json not found');
        return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
        if (packageJson.scripts.build === 'prisma generate') {
            console.log('✅ Build script configured correctly for Supabase');
            return true;
        } else {
            console.log('❌ Build script needs to be updated for Supabase');
            console.log(`   Current: ${packageJson.scripts.build}`);
            console.log('   Should be: prisma generate');
            return false;
        }
    } else {
        console.log('❌ Build script not found in package.json');
        return false;
    }
}

// Check Prisma schema
function checkPrismaSchema() {
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
        console.log('❌ prisma/schema.prisma not found');
        return false;
    }
    
    const content = fs.readFileSync(schemaPath, 'utf8');
    
    if (content.includes('provider = "postgresql"')) {
        console.log('✅ Prisma schema configured for PostgreSQL');
        return true;
    } else {
        console.log('❌ Prisma schema not configured for PostgreSQL');
        return false;
    }
}

// Main verification
async function main() {
    console.log('📋 Checking Render deployment readiness...\n');
    
    const checks = [
        { name: 'Render YAML Configuration', fn: checkRenderYaml },
        { name: 'Package.json Build Script', fn: checkPackageJson },
        { name: 'Prisma Schema', fn: checkPrismaSchema }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
        console.log(`\n🔍 ${check.name}:`);
        const passed = check.fn();
        if (!passed) {
            allPassed = false;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (allPassed) {
        console.log('🎉 All checks passed! Ready for Render deployment');
        console.log('\n📝 Next steps:');
        console.log('1. Commit and push your changes to GitHub');
        console.log('2. Go to Render Dashboard');
        console.log('3. Create new Web Service from GitHub repo');
        console.log('4. Render will automatically use render.yaml configuration');
        console.log('5. Wait for deployment to complete');
        console.log('\n🔗 Your app will be available at: https://your-app-name.onrender.com');
    } else {
        console.log('❌ Some checks failed. Please fix the issues above before deploying.');
    }
}

main().catch(console.error);