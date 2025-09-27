#!/usr/bin/env node

console.log('🔧 Creating Database Test Endpoint for Render');
console.log('==============================================');

const fs = require('fs');
const path = require('path');

// Create a simple test endpoint that we can add to the backend
const testEndpointCode = `
// Add this to your backend routes for testing database connection on Render
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic Prisma connection
    const userCount = await prisma.user.count();
    console.log(\`✅ Database connected! Found \${userCount} users\`);
    
    // Test specific user lookup
    const testUser = await prisma.user.findUnique({
      where: { email: 'desley_u@hotmail.com' }
    });
    
    if (testUser) {
      console.log('✅ Test user found:', testUser.email);
    } else {
      console.log('❌ Test user not found');
    }
    
    res.json({
      status: 'success',
      userCount,
      testUserFound: !!testUser,
      testUser: testUser ? {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        status: testUser.status
      } : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});
`;

// Read the current backend app.js or server.js to see where to add this
const backendPath = path.join(__dirname, 'backend');
const possibleFiles = ['app.js', 'server.js', 'index.js'];

let mainFile = null;
for (const file of possibleFiles) {
  const filePath = path.join(backendPath, file);
  if (fs.existsSync(filePath)) {
    mainFile = filePath;
    break;
  }
}

if (mainFile) {
  console.log(`📁 Found main backend file: ${path.basename(mainFile)}`);
  
  const content = fs.readFileSync(mainFile, 'utf8');
  
  // Check if test endpoint already exists
  if (content.includes('/api/test-db')) {
    console.log('✅ Test endpoint already exists');
  } else {
    console.log('➕ Adding test endpoint...');
    
    // Find a good place to insert the test endpoint
    // Look for existing route definitions
    const lines = content.split('\n');
    let insertIndex = -1;
    
    // Find the last route definition or before app.listen
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('app.get') || lines[i].includes('app.post') || 
          lines[i].includes('app.use') && lines[i].includes('/api')) {
        insertIndex = i + 1;
        break;
      }
    }
    
    if (insertIndex === -1) {
      // Find app.listen as fallback
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('app.listen') || lines[i].includes('server.listen')) {
          insertIndex = i;
          break;
        }
      }
    }
    
    if (insertIndex !== -1) {
      lines.splice(insertIndex, 0, '', '// Database test endpoint for debugging', testEndpointCode);
      const newContent = lines.join('\n');
      
      // Create backup
      fs.writeFileSync(mainFile + '.backup', content);
      fs.writeFileSync(mainFile, newContent);
      
      console.log('✅ Test endpoint added to backend');
      console.log('📄 Backup created at:', path.basename(mainFile) + '.backup');
    } else {
      console.log('❌ Could not find suitable place to insert test endpoint');
      console.log('📝 Manual addition required');
    }
  }
} else {
  console.log('❌ Could not find main backend file');
  console.log('📁 Checked:', possibleFiles.join(', '));
}

console.log('\n🚀 Next steps:');
console.log('1. Commit and push the test endpoint');
console.log('2. Wait for Render to redeploy');
console.log('3. Test: curl https://globalscout-backend-qbyh.onrender.com/api/test-db');
console.log('4. This will show the exact database error on Render');

// Create deployment script
const deployScript = `#!/bin/bash
echo "🚀 Deploying database test endpoint..."
git add .
git commit -m "Add database test endpoint for Render debugging"
git push origin main
echo "✅ Pushed to main - Render will redeploy"
echo "⏳ Wait 2-3 minutes then test:"
echo "curl https://globalscout-backend-qbyh.onrender.com/api/test-db"
`;

fs.writeFileSync(path.join(__dirname, 'deploy-db-test.sh'), deployScript);
fs.chmodSync(path.join(__dirname, 'deploy-db-test.sh'), '755');

console.log('✅ Created deploy-db-test.sh script');