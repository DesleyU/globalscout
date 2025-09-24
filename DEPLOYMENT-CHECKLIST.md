# 🚀 GlobalScout Production Deployment Checklist

## ✅ Pre-deployment Setup

### 1. Database Setup
- [ ] PostgreSQL database created
- [ ] Database URL configured in .env
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] Database seeded (optional): `npm run seed`

### 2. Environment Configuration
- [ ] Backend .env configured with production values
- [ ] Frontend .env.production configured
- [ ] All secrets generated and secure
- [ ] API keys configured (Stripe, API-Football, etc.)

### 3. Security Configuration
- [ ] JWT secrets configured (✅ Generated automatically)
- [ ] CORS origins configured for your domain
- [ ] Rate limiting configured
- [ ] HTTPS/SSL certificates ready

### 4. External Services
- [ ] Stripe account configured (live keys)
- [ ] Email service configured (SMTP)
- [ ] CDN configured (optional)
- [ ] Monitoring service configured (Sentry, optional)

## 🔧 Generated Secrets (Keep Secure!)

```
JWT_SECRET: d7a939f54fe7f42c5771432df7b87ceea2748f2580d77fb12725fac3880c43ea
JWT_REFRESH_SECRET: 06d9e34fab63a41664b7edd49297be4dd64f370966d24de5ac5fa210e67b326a
SESSION_SECRET: b9065e714cef3773f46884210d5adce27b058e471ce46519cb4d679951724eb4
HEALTH_CHECK_TOKEN: 846322c49db1ec44b29154de99cbb286
```

## 🌐 Domain Configuration

### Backend (API)
- Domain: `api.your-domain.com`
- Port: 5000 (or configured port)
- Health check: `https://api.your-domain.com/health`

### Frontend
- Domain: `your-domain.com`
- CDN: `cdn.your-domain.com` (optional)

## 📦 Deployment Commands

### Backend Deployment
```bash
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm start
```

### Frontend Deployment
```bash
cd frontend
npm install
npm run build
# Serve dist/ folder with nginx/apache
```

## 🔍 Post-deployment Verification

- [ ] Backend health check responds: `curl https://api.your-domain.com/health`
- [ ] Frontend loads correctly
- [ ] User registration/login works
- [ ] Payment flow works (test mode first)
- [ ] Database connections stable
- [ ] SSL certificates valid

## 🚨 Emergency Rollback

If issues occur:
1. Revert to previous deployment
2. Check logs: `pm2 logs` or server logs
3. Verify database integrity
4. Contact support if needed

## 📞 Support Contacts

- Database: [Your DB provider support]
- Hosting: [Your hosting provider support]
- Domain: [Your domain registrar support]
- SSL: [Your SSL provider support]
