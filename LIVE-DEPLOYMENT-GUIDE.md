# 🚀 GlobalScout Live Deployment Guide

## Stap-voor-Stap Deployment Instructies

### ✅ Voorbereiding Voltooid
- Railway CLI geïnstalleerd
- Vercel CLI geïnstalleerd  
- Alle configuratiebestanden klaar
- Production build getest

---

## 📋 Stap 1: Supabase Database Setup (5-10 minuten)

### 1.1 Supabase Account & Project
1. Ga naar **https://supabase.com**
2. Maak een account aan of log in
3. Klik op **"New Project"**
4. Kies een **Project Name**: `globalscout-production`
5. Kies een **Organization** (of maak een nieuwe)
6. Kies een **Region** dichtbij je gebruikers (bijv. West Europe)
7. Stel een **sterk database wachtwoord** in
8. Klik **"Create new project"**
9. Wacht 2-3 minuten tot het project klaar is

### 1.2 Credentials Verzamelen
Na project creatie, ga naar **Settings > API**:

```bash
# Kopieer deze waarden:
Project URL: https://your-project-ref.supabase.co
Anon Key: eyJ... (lange string)
Service Role Key: eyJ... (andere lange string)
```

Ga naar **Settings > Database** voor:
```bash
Database URL: postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

### 1.3 Backend Environment Configureren
```bash
# Open backend/.env en update:
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres"
```

### 1.4 Database Schema Setup
```bash
cd backend
npx prisma db push
npx prisma generate
npm run seed
```

---

## 📋 Stap 2: Backend Deployment naar Railway (10-15 minuten)

### 2.1 Railway Login
```bash
railway login
```
- Dit opent je browser
- Log in met GitHub, Google, of email
- Keer terug naar terminal

### 2.2 Railway Project Setup
```bash
# In de root directory
railway init
```
- Kies **"Create new project"**
- Geef het project een naam: `globalscout-backend`
- Kies **"Deploy from current directory"**

### 2.3 Environment Variables Instellen
```bash
railway variables set DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres"
railway variables set JWT_SECRET="your-super-secret-jwt-key-here"
railway variables set STRIPE_SECRET_KEY="sk_test_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_test_..."
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
```

### 2.4 Deploy Backend
```bash
railway up
```
- Railway detecteert automatisch je Node.js app
- Deployment duurt 2-5 minuten
- Je krijgt een URL zoals: `https://globalscout-backend-production.up.railway.app`

**✅ Noteer je backend URL voor de frontend!**

---

## 📋 Stap 3: Frontend Deployment naar Vercel (5-10 minuten)

### 3.1 Frontend Environment Configureren
```bash
# Update frontend/.env.production:
VITE_API_URL="https://globalscout-backend-production.up.railway.app"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3.2 Frontend Build
```bash
cd frontend
npm run build
```

### 3.3 Vercel Deployment
```bash
npx vercel
```

Volg de prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Kies je account
- **Link to existing project?** → No
- **Project name** → `globalscout-frontend`
- **Directory** → `./` (current directory)
- **Override settings?** → No

### 3.4 Environment Variables in Vercel
```bash
npx vercel env add VITE_API_URL
# Voer in: https://globalscout-backend-production.up.railway.app

npx vercel env add VITE_STRIPE_PUBLISHABLE_KEY  
# Voer in: pk_test_...
```

### 3.5 Production Deployment
```bash
npx vercel --prod
```

**✅ Je krijgt een URL zoals: `https://globalscout-frontend.vercel.app`**

---

## 📋 Stap 4: CORS Configuratie (5 minuten)

### 4.1 Backend CORS Update
Update je backend environment in Railway:
```bash
railway variables set FRONTEND_URL="https://globalscout-frontend.vercel.app"
railway variables set CORS_ORIGIN="https://globalscout-frontend.vercel.app"
```

### 4.2 Redeploy Backend
```bash
railway up
```

---

## 📋 Stap 5: Testing & Verificatie (10 minuten)

### 5.1 Backend Health Check
Ga naar: `https://globalscout-backend-production.up.railway.app/health`
- Verwacht: `{"status": "OK", "timestamp": "..."}`

### 5.2 Frontend Test
Ga naar: `https://globalscout-frontend.vercel.app`
- Test registratie
- Test login
- Test dashboard functionaliteit

### 5.3 Database Verificatie
```bash
cd backend
npx prisma studio
```
- Controleer of data correct wordt opgeslagen

---

## 🎉 Deployment Voltooid!

### 📊 Je Live URLs:
- **Frontend:** `https://globalscout-frontend.vercel.app`
- **Backend:** `https://globalscout-backend-production.up.railway.app`
- **Database:** Supabase Dashboard

### 🔧 Handige Commando's:
```bash
# Backend logs bekijken
railway logs

# Frontend redeploy
npx vercel --prod

# Database management
npx prisma studio
```

### 🚨 Troubleshooting:
- **CORS errors:** Controleer FRONTEND_URL in Railway
- **Database errors:** Controleer DATABASE_URL
- **Build errors:** Run `npm run build` lokaal eerst
- **Environment variables:** Controleer alle keys in Railway/Vercel

### 📞 Support:
- Railway: https://railway.app/help
- Vercel: https://vercel.com/support  
- Supabase: https://supabase.com/docs

---

**🎊 Gefeliciteerd! GlobalScout is nu live in productie!**