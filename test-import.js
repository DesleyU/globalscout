// Test script to verify import functionality
console.log('Testing import functionality...');

// Test if we can access the frontend
fetch('http://localhost:5173')
  .then(response => {
    console.log('Frontend accessible:', response.status === 200);
    return response.text();
  })
  .then(html => {
    console.log('Frontend loaded successfully');
  })
  .catch(error => {
    console.error('Error accessing frontend:', error);
  });

// Test login API
const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'desley.ubbink@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('Login test result:', data);
    
    if (data.token) {
      // Test import with the token
      const importResponse = await fetch('http://localhost:3000/api/football/players/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        },
        body: JSON.stringify({ playerId: 61415 })
      });
      
      const importData = await importResponse.json();
      console.log('Import test result:', importData);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
};

testLogin();
