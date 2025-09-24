const puppeteer = require('puppeteer');

async function testLogin() {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen to console logs
    page.on('console', msg => {
      console.log('BROWSER LOG:', msg.type(), msg.text());
    });
    
    // Listen to network requests
    page.on('response', response => {
      if (response.url().includes('/api/auth/login')) {
        console.log('LOGIN API RESPONSE:', response.status(), response.url());
      }
    });
    
    // Go to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForSelector('input[name="email"]');
    
    console.log('Testing BASIC account login...');
    
    // Fill in BASIC account credentials
    await page.type('input[name="email"]', 'test.basic@example.com');
    await page.type('input[name="password"]', 'testpassword123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Check if there are any error messages
    const errorElements = await page.$$('.error, .toast-error, [data-testid="error"]');
    if (errorElements.length > 0) {
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log('Error message found:', text);
      }
    }
    
    // Check if login was successful (redirected to dashboard)
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ BASIC account login successful!');
    } else {
      console.log('❌ BASIC account login failed - still on login page');
    }
    
    // Wait a bit to see the result
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testLogin();