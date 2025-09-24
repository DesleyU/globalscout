// Vercel serverless function entry point
const app = require('../backend/src/server');

// Export as a Vercel serverless function
module.exports = (req, res) => {
  return app(req, res);
};