// Debug script to test frontend import functionality
const puppeteer = require('puppeteer');

async function debugImport() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  // Listen for network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('API REQUEST:', request.method(), request.url());
    }
  });
  
  // Listen for network responses
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('API RESPONSE:', response.status(), response.url());
    }
  });
  
  try {
    // Navigate to the frontend
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    console.log('Page loaded, checking for login form...');
    
    // Check if we need to login
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('Login form found, logging in...');
      
      // Fill in login credentials for Desley
      await page.type('input[name="email"]', 'desley_u@hotmail.com');
      await page.type('input[name="password"]', 'password123');
      
      // Submit login form
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForTimeout(3000);
    }
    
    // Navigate to profile page
    console.log('Navigating to profile...');
    await page.goto('http://localhost:3000/profile');
    await page.waitForTimeout(2000);
    
    // Look for import button
    const importButton = await page.$('button:contains("Statistieken Importeren")');
    if (importButton) {
      console.log('Import button found, clicking...');
      await importButton.click();
      await page.waitForTimeout(1000);
      
      // Look for the actual import button in the form
      const actualImportButton = await page.$('button:contains("Mijn Statistieken Importeren")');
      if (actualImportButton) {
        console.log('Clicking actual import button...');
        await actualImportButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    console.log('Debug complete. Check console output above for any errors.');
    
  } catch (error) {
    console.error('Error during debug:', error);
  }
  
  // Keep browser open for manual inspection
  console.log('Browser will stay open for manual inspection...');
}

debugImport().catch(console.error);