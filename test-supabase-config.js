console.log('Starting test...');

try {
  require('dotenv').config();
  console.log('Dotenv loaded');
  
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
  
  const config = require('./src/config/supabase');
  console.log('Config loaded:', Object.keys(config));
  
} catch (error) {
  console.error('Error:', error.message);
}