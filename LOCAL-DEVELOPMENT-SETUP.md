# Globalscout - Local Development Setup

## Overview
This document describes the working local development setup for the Globalscout application after resolving deployment issues with various cloud platforms.

## Architecture
- **Frontend**: React + Vite development server (localhost:5173)
- **Backend**: Node.js + Express API server (localhost:5000)
- **Database**: SQLite (local file-based database)
- **Authentication**: JWT tokens with cookie storage

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm start
```

The backend will start on `http://localhost:5000` with the following endpoints:
- Health check: `GET /health`
- API routes: `/api/*`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### 3. Environment Configuration

#### Backend (.env)
The backend uses a local SQLite database and doesn't require external services.

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your-test-publishable-key"
```

## Tested Functionality

### ✅ Authentication
- **User Registration**: Successfully tested with required fields (email, password, firstName, lastName, role, position, age)
- **User Login**: JWT token generation and authentication working
- **Protected Routes**: JWT middleware properly validates tokens

### ✅ Profile Management
- **Profile Retrieval**: GET /api/users/profile returns complete user data
- **Profile Updates**: PUT /api/users/profile successfully updates user information
- **Data Persistence**: Changes are saved to SQLite database

### ✅ API Endpoints
- Health check endpoint responding correctly
- All authentication endpoints functional
- Profile management endpoints working
- Proper error handling and validation

## Database
- **Type**: SQLite (file-based)
- **Location**: `backend/prisma/dev.db`
- **Schema**: Managed by Prisma ORM
- **Migrations**: Applied automatically on startup

## Development Workflow

1. Start backend server: `cd backend && npm start`
2. Start frontend server: `cd frontend && npm run dev`
3. Access application at `http://localhost:5173`
4. API available at `http://localhost:5000/api`

## Testing
The following test user has been created and verified:
- **Email**: test@example.com
- **Password**: TestPassword123!
- **Role**: PLAYER
- **Position**: MIDFIELDER

## Deployment Challenges Encountered
- **Render**: Database connection and environment variable issues
- **Vercel**: Authentication/SSO redirect problems preventing API access
- **Railway**: Account upgrade required for deployment
- **Heroku**: Account verification and payment information required
- **Netlify**: CLI installation permission issues

## Current Status
✅ **Local Development**: Fully functional
❌ **Cloud Deployment**: Pending resolution of platform-specific issues

## Next Steps
1. Consider alternative deployment platforms
2. Investigate Vercel authentication issues
3. Set up proper production database
4. Configure environment variables for production

## Support
For development issues, check:
1. Backend logs in terminal
2. Frontend console in browser
3. Network tab for API calls
4. Database file permissions

---
*Last updated: September 24, 2025*