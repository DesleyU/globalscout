// Vercel serverless function for Globalscout backend
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import the main app from backend
const app = require('../backend/src/app');

// Export the Express app as a Vercel serverless function
module.exports = app;