# 🎨 Frontend Deployment Options

## 1. Vercel (Recommended - Best for React/Vite)

### Quick Deploy:
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd frontend
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - VITE_API_URL
   - VITE_STRIPE_PUBLISHABLE_KEY

### GitHub Integration:
1. Connect your repository to Vercel
2. Set build settings:
   - Framework: Vite
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist

## 2. Netlify

### Drag & Drop:
1. Build locally: `cd frontend && npm run build`
2. Drag the `dist` folder to Netlify

### Git Integration:
1. Connect your repository to Netlify
2. Set build settings:
   - Base directory: frontend
   - Build command: npm run build
   - Publish directory: frontend/dist

## 3. Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set build settings:
   - Build command: cd frontend && npm run build
   - Build output directory: frontend/dist

## 4. GitHub Pages

1. Enable GitHub Pages in repository settings
2. Use GitHub Actions workflow (already created)
3. Set repository secrets for environment variables

## 5. Static File Server

1. Build the project:
   ```bash
   cd frontend
   npm run build
   ```

2. Serve the `dist` folder with any web server:
   - Nginx
   - Apache
   - Caddy
   - Express.js static server

## Environment Variables Required:

- VITE_API_URL (your backend URL)
- VITE_STRIPE_PUBLISHABLE_KEY
- VITE_CDN_URL (optional)

## Custom Domain Setup:

1. Add CNAME record: www.yourdomain.com → your-app.vercel.app
2. Add A record: yourdomain.com → hosting provider IP
3. Configure SSL (usually automatic with modern hosts)

## Performance Optimization:

- All assets are automatically optimized by Vite
- Gzip/Brotli compression enabled
- CDN distribution included with most hosts
- Browser caching headers configured
