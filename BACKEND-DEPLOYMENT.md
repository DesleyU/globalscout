# 🚀 Backend Deployment Options

## 1. Railway (Recommended - Easy & Fast)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Add environment variables in Railway dashboard:
   - DATABASE_URL (from Supabase)
   - JWT_SECRET
   - JWT_REFRESH_SECRET
   - STRIPE_SECRET_KEY
   - etc.

## 2. Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the render.yaml configuration
4. Add environment variables in Render dashboard

## 3. DigitalOcean App Platform

1. Connect your GitHub repository
2. Select Node.js environment
3. Set build command: `cd backend && npm install`
4. Set run command: `cd backend && npm start`
5. Add environment variables

## 4. Docker Deployment

1. Build and run locally:
   ```bash
   docker build -t globalscout-backend .
   docker run -p 5000:5000 --env-file backend/.env globalscout-backend
   ```

2. Or use docker-compose:
   ```bash
   docker-compose up -d
   ```

## 5. VPS/Server Deployment

1. Install Node.js, PM2, and Nginx on your server
2. Clone repository and install dependencies
3. Set up environment variables
4. Use PM2 to manage the process:
   ```bash
   cd backend
   pm2 start npm --name "globalscout-backend" -- start
   pm2 save
   pm2 startup
   ```

## Environment Variables Required:

- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- NODE_ENV=production
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- (see backend/.env.production.configured for full list)
