// Debug script to test frontend authentication and API calls
// Run this in browser console

console.log('=== Frontend Debug Script ===');

// Check if we have a token
const token = document.cookie.split('; ').find(row => row.startsWith('token='));
console.log('Token cookie:', token);

// Test API call directly
async function testAPI() {
  try {
    const response = await fetch('/api/media/videos', {
      headers: {
        'Authorization': `Bearer ${token ? token.split('=')[1] : 'no-token'}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    const data = await response.json();
    console.log('API Response data:', data);
    
    if (response.ok) {
      console.log('✅ API call successful, videos found:', data.length);
    } else {
      console.log('❌ API call failed:', data.error);
    }
  } catch (error) {
    console.log('❌ API call error:', error);
  }
}

// Check React Query cache
if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('React Query available');
} else {
  console.log('React Query not available');
}

// Run the test
testAPI();

console.log('=== End Debug Script ===');