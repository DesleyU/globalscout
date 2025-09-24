// Debug script to check premium badge visibility
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

if (token) {
  fetch('/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Current user profile:', data);
    console.log('Account type:', data.user?.accountType);
    console.log('Should show premium badge:', data.user?.accountType === 'PREMIUM');
  })
  .catch(error => {
    console.error('Error fetching profile:', error);
  });
} else {
  console.log('No token found - user not logged in');
}