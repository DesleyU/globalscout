const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const validator = require('validator');

// Enhanced rate limiting for different endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// General API rate limiting
const generalLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 100 : 1000,
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // Only 5 attempts per 15 minutes
  'Too many authentication attempts, please try again later.'
);

// Rate limiting for file uploads
const uploadLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads, please try again later.'
);

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Input validation middleware
const validateInput = (req, res, next) => {
  // Sanitize all string inputs
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS
        obj[key] = validator.escape(obj[key]);
        // Trim whitespace
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

// Email validation
const validateEmail = (email) => {
  return validator.isEmail(email) && validator.isLength(email, { max: 254 });
};

// Password validation
const validatePassword = (password) => {
  return validator.isLength(password, { min: 8, max: 128 }) &&
         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    return next();
  }

  // Check file size
  const maxSize = process.env.MAX_FILE_SIZE || 10485760; // 10MB default
  if (file.size > maxSize) {
    return res.status(400).json({
      error: 'File too large',
      message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    });
  }

  // Check file type for images
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi'];
  
  if (file.fieldname === 'avatar' || file.fieldname === 'image') {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, and GIF images are allowed'
      });
    }
  }

  if (file.fieldname === 'video') {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only MP4, MOV, and AVI videos are allowed'
      });
    }
  }

  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    };
    
    // Log suspicious activity
    if (req.url.includes('..') || 
        req.url.includes('<script>') || 
        req.url.includes('SELECT') ||
        req.url.includes('UNION')) {
      console.warn('🚨 Suspicious request detected:', logData);
    }
  }
  
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  speedLimiter,
  validateInput,
  validateEmail,
  validatePassword,
  validateFileUpload,
  securityHeaders,
  securityLogger
};