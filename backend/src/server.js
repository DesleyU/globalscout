require('dotenv').config();
const express = require('express');
// Trigger deployment - reactivating suspended service
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import security middleware
const {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  speedLimiter,
  validateInput,
  securityHeaders,
  securityLogger
} = require('./middleware/security');

// Import Prisma client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const connectionRoutes = require('./routes/connections');
const followRoutes = require('./routes/followRoutes');
const adminRoutes = require('./routes/admin');
const mediaRoutes = require('./routes/media');
const statsRoutes = require('./routes/stats');
const messageRoutes = require('./routes/messages');
const accountRoutes = require('./routes/account');
const paymentRoutes = require('./routes/payment');
const playerUpdatesRoutes = require('./routes/playerUpdates');




const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(securityHeaders);

// Security logging
app.use(securityLogger);

// Helmet security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false
}));

// Rate limiting and speed control
app.use(speedLimiter);
app.use(generalLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: process.env.NODE_ENV === 'production' ? 86400 : 0, // 24 hours in production
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb'
}));

// Input validation middleware
app.use(validateInput);

// Static file serving with security
app.use('/uploads', express.static('uploads', {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Globalscout API',
      version: '1.0.0',
      description: 'API for Globalscout - Football networking platform',
      contact: {
        name: 'Globalscout Team',
        email: 'support@globalscout.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-api-domain.com' 
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test endpoint for debugging Render deployment
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic Prisma connection
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected! Found ${userCount} users`);
    
    // Test specific user lookup
    const testUser = await prisma.user.findUnique({
      where: { email: 'desley_u@hotmail.com' }
    });
    
    if (testUser) {
      console.log('✅ Test user found:', testUser.email);
    } else {
      console.log('❌ Test user not found');
    }
    
    res.json({
      status: 'success',
      userCount,
      testUserFound: !!testUser,
      testUser: testUser ? {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        status: testUser.status
      } : null,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', uploadLimiter, mediaRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/player-updates', playerUpdatesRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(400).json({ 
      error: 'Unique constraint violation',
      message: 'A record with this data already exists'
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Record not found',
      message: 'The requested record does not exist'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Default error
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});



// Database connection test
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Database has ${userCount} users`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️ Server will continue without database for now');
    // Don't exit the process, let the server start anyway
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  await testDatabaseConnection();
});

module.exports = app;