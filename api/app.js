// Simple Vercel API endpoint for testing
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Globalscout API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Globalscout API',
    endpoints: ['/health'],
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;