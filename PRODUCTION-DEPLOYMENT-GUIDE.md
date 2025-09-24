# 🚀 GlobalScout Production Deployment Guide

## 📋 Overview
Complete stap-voor-stap gids voor het deployen van GlobalScout naar productie.

---

## ✅ Voorbereiding Voltooid

De volgende setup scripts zijn al uitgevoerd:
- ✅ `setup-postgres.js` - PostgreSQL schema configuratie
- ✅ `setup-production.js` - Productie environment setup
- ✅ `setup-ssl.js` - SSL/HTTPS configuratie
- ✅ `setup-cdn.js` - CDN setup voor media files
- ✅ `deploy.sh` - Basis deployment setup
- ✅ Frontend build test geslaagd

---

## 🗄️ 1. Database Setup (Supabase)

### Stap 1: Supabase Project Aanmaken
1. Ga naar [https://supabase.com](https://supabase.com)
2. Maak een account aan of log in
3. Klik op "New Project"
4. Kies een organisatie en projectnaam: `globalscout-prod`
5. Kies een regio dichtbij je gebruikers (bijv. West Europe)
6. Stel een sterk database wachtwoord in
7. Wacht 2-3 minuten tot het project is aangemaakt

### Stap 2: Database Configuratie
1. Ga naar Project Settings > API
2. Kopieer de volgende waarden:
   - Project URL: `https://your-project-ref.supabase.co`
   - Anon/Public Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Ga naar Project Settings > Database
4. Kopieer de Connection String:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
   ```

### Stap 3: Database Schema Deployen
```bash
# Update backend/.env met je Supabase DATABASE_URL
cd backend
npx prisma db push
npx prisma generate
npm run seed  # Optioneel: test data
```

---

## 🚀 2. Backend Deployment (Railway)

### Optie A: Railway (Aanbevolen)
```bash
# Installeer Railway CLI
npm install -g @railway/cli

# Login en deploy
railway login
railway init
railway up
```

### Environment Variables in Railway Dashboard:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
JWT_SECRET=d7a939f54fe7f42c5771432df7b87ceea2748f2580d77fb12725fac3880c43ea
JWT_REFRESH_SECRET=06d9e34fab63a41664b7edd49297be4dd64f370966d24de5ac5fa210e67b326a
NODE_ENV=production
PORT=5000
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
FRONTEND_URL=https://your-frontend-domain.com
```

### Optie B: Render
1. Connect GitHub repository to Render
2. Create new Web Service
3. Use `render.yaml` configuration
4. Add environment variables

### Optie C: DigitalOcean App Platform
1. Connect GitHub repository
2. Set build command: `cd backend && npm install`
3. Set run command: `cd backend && npm start`
4. Add environment variables

---

## 🎨 3. Frontend Deployment (Vercel)

### Optie A: Vercel (Aanbevolen)
```bash
# Installeer Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel
```

### Environment Variables in Vercel Dashboard:
```
VITE_API_URL=https://your-backend-domain.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
VITE_CDN_URL=https://cdn.your-domain.com
```

### Optie B: Netlify
1. Drag & drop `frontend/dist` folder to Netlify
2. Of connect GitHub repository
3. Set build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

### Optie C: Cloudflare Pages
1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`

---

## 🌐 4. Domain & SSL Setup

### DNS Configuratie
```
# A Records
yourdomain.com → Vercel IP (automatisch)
api.yourdomain.com → Railway IP (automatisch)

# CNAME Records  
www.yourdomain.com → yourdomain.com
cdn.yourdomain.com → CloudFront domain
```

### SSL Certificaten
- Vercel: Automatisch SSL voor custom domains
- Railway: Automatisch SSL voor custom domains
- Cloudflare: Gratis SSL met proxy

---

## 🧪 5. Testing & Verificatie

### Backend API Test
```bash
# Health check
curl https://your-backend-domain.railway.app/health

# API test
curl https://your-backend-domain.railway.app/api/auth/test
```

### Frontend Test
1. Open https://your-frontend-domain.vercel.app
2. Test user registration
3. Test login/logout
4. Test payment flow
5. Test file upload

### Performance Test
- Google PageSpeed Insights
- GTmetrix
- WebPageTest

---

## 📊 6. Monitoring & Maintenance

### Uptime Monitoring
- UptimeRobot (gratis)
- Pingdom
- StatusCake

### Error Tracking
```bash
# Sentry setup
npm install @sentry/node @sentry/react
```

### Backup Strategy
- Supabase: Automatische daily backups
- Code: GitHub repository
- Media: S3 versioning

---

## 🔧 7. Environment Variables Checklist

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Server
NODE_ENV=production
PORT=5000

# CORS
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email (optioneel)
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

### Frontend (.env.production)
```bash
VITE_API_URL=https://api.your-domain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_CDN_URL=https://cdn.your-domain.com
```

---

## 🚨 8. Security Checklist

- ✅ HTTPS overal ingeschakeld
- ✅ Environment variables veilig opgeslagen
- ✅ CORS correct geconfigureerd
- ✅ Rate limiting ingeschakeld
- ✅ Input validatie actief
- ✅ SQL injection bescherming (Prisma)
- ✅ XSS bescherming
- ✅ Secure headers ingesteld

---

## 📞 9. Support & Troubleshooting

### Logs Bekijken
```bash
# Railway
railway logs

# Vercel
vercel logs

# Local debugging
cd backend && npm start
cd frontend && npm run dev
```

### Common Issues
1. **CORS errors**: Check FRONTEND_URL in backend
2. **Database connection**: Verify DATABASE_URL
3. **Build failures**: Check environment variables
4. **Payment issues**: Verify Stripe keys

### Contact Support
- Railway: [railway.app/help](https://railway.app/help)
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)

---

## ✅ Deployment Status

**Database**: ✅ Supabase configuratie klaar  
**Backend**: ✅ Railway deployment files klaar  
**Frontend**: ✅ Vercel deployment files klaar  
**SSL**: ✅ Automatisch via hosting providers  
**Monitoring**: ⏳ Te configureren na deployment  

---

## 🎯 Quick Start Commands

```bash
# 1. Database setup
node setup-supabase.js

# 2. Deploy backend
railway login && railway up

# 3. Deploy frontend  
cd frontend && vercel

# 4. Test deployment
curl https://your-api.railway.app/health
```

---

*Laatste update: $(date)*  
*GlobalScout Production Deployment v2.0*