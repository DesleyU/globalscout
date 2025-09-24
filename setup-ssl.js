#!/usr/bin/env node

/**
 * SSL/HTTPS Setup Script
 * Helps configure SSL certificates and HTTPS for production
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 SSL/HTTPS Setup for GlobalScout');
console.log('==================================');

// Create nginx configuration
function createNginxConfig() {
    console.log('\n🌐 Creating nginx configuration...');
    
    const nginxConfig = `# GlobalScout Nginx Configuration
# Place this in /etc/nginx/sites-available/globalscout

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Frontend (React App)
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend Static Files
    root /var/www/globalscout/frontend/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend Routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy to Backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}

# API Subdomain (Optional - for api.your-domain.com)
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration (same as above)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # CORS Headers for API
    add_header Access-Control-Allow-Origin "https://your-domain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    # Proxy to Backend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

    fs.writeFileSync('nginx-globalscout.conf', nginxConfig);
    console.log('✅ Nginx configuration created: nginx-globalscout.conf');
}

// Create Let's Encrypt setup script
function createLetsEncryptScript() {
    console.log('\n🔐 Creating Let\'s Encrypt setup script...');
    
    const letsEncryptScript = `#!/bin/bash

# Let's Encrypt SSL Certificate Setup for GlobalScout
# Run this script on your production server

echo "🔒 Setting up SSL certificates with Let's Encrypt"
echo "================================================"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    
    # Ubuntu/Debian
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    
    # CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    
    # macOS
    elif command -v brew &> /dev/null; then
        brew install certbot
    
    else
        echo "❌ Please install certbot manually for your system"
        exit 1
    fi
fi

echo "✅ Certbot is available"

# Domain configuration
read -p "🌐 Enter your domain name (e.g., your-domain.com): " DOMAIN
read -p "📧 Enter your email for Let's Encrypt notifications: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ Domain and email are required"
    exit 1
fi

echo "🔍 Setting up SSL certificate for: $DOMAIN"

# Stop nginx temporarily
echo "⏸️  Stopping nginx temporarily..."
sudo systemctl stop nginx

# Obtain certificate
echo "📜 Obtaining SSL certificate..."
sudo certbot certonly --standalone \\
    --email "$EMAIL" \\
    --agree-tos \\
    --no-eff-email \\
    -d "$DOMAIN" \\
    -d "www.$DOMAIN" \\
    -d "api.$DOMAIN"

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # Update nginx configuration
    echo "🔧 Updating nginx configuration..."
    sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/globalscout
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/globalscout /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid"
        
        # Start nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
        
        echo "🎉 SSL setup completed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "1. Update your DNS records to point to this server"
        echo "2. Test your site: https://$DOMAIN"
        echo "3. Set up automatic certificate renewal"
        echo ""
        echo "🔄 To set up auto-renewal:"
        echo "sudo crontab -e"
        echo "Add this line:"
        echo "0 12 * * * /usr/bin/certbot renew --quiet"
        
    else
        echo "❌ Nginx configuration error"
        exit 1
    fi
    
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Please check your domain DNS settings and try again"
    exit 1
fi`;

    fs.writeFileSync('setup-letsencrypt.sh', letsEncryptScript);
    fs.chmodSync('setup-letsencrypt.sh', '755');
    console.log('✅ Let\'s Encrypt setup script created: setup-letsencrypt.sh');
}

// Create SSL verification script
function createSSLVerificationScript() {
    console.log('\n🔍 Creating SSL verification script...');
    
    const verificationScript = `#!/usr/bin/env node

/**
 * SSL Certificate Verification Script
 * Checks SSL certificate status and security
 */

const https = require('https');
const tls = require('tls');

function checkSSL(domain) {
    return new Promise((resolve, reject) => {
        console.log(\`🔍 Checking SSL for: \${domain}\`);
        
        const options = {
            host: domain,
            port: 443,
            method: 'GET',
            path: '/health',
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            const cert = res.socket.getPeerCertificate();
            
            if (cert) {
                const now = new Date();
                const expiry = new Date(cert.valid_to);
                const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
                
                console.log(\`✅ SSL Certificate Information:\`);
                console.log(\`   Subject: \${cert.subject.CN}\`);
                console.log(\`   Issuer: \${cert.issuer.O}\`);
                console.log(\`   Valid from: \${cert.valid_from}\`);
                console.log(\`   Valid to: \${cert.valid_to}\`);
                console.log(\`   Days until expiry: \${daysUntilExpiry}\`);
                
                if (daysUntilExpiry < 30) {
                    console.log(\`⚠️  Certificate expires in \${daysUntilExpiry} days - consider renewal\`);
                }
                
                resolve({
                    domain,
                    cert,
                    daysUntilExpiry,
                    status: 'valid'
                });
            } else {
                reject(new Error('No certificate found'));
            }
        });
        
        req.on('error', (error) => {
            console.error(\`❌ SSL check failed for \${domain}: \${error.message}\`);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.error(\`❌ SSL check timeout for \${domain}\`);
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        req.end();
    });
}

async function verifySSL() {
    const domains = process.argv.slice(2);
    
    if (domains.length === 0) {
        console.log('Usage: node verify-ssl.js domain1.com domain2.com ...');
        console.log('Example: node verify-ssl.js your-domain.com api.your-domain.com');
        process.exit(1);
    }
    
    console.log('🔒 SSL Certificate Verification');
    console.log('==============================');
    
    for (const domain of domains) {
        try {
            await checkSSL(domain);
            console.log('');
        } catch (error) {
            console.error(\`❌ Failed to verify \${domain}: \${error.message}\`);
            console.log('');
        }
    }
}

verifySSL();`;

    fs.writeFileSync('verify-ssl.js', verificationScript);
    console.log('✅ SSL verification script created: verify-ssl.js');
}

// Main SSL setup function
function setupSSL() {
    console.log('\n🚀 Starting SSL/HTTPS setup...');
    
    createNginxConfig();
    createLetsEncryptScript();
    createSSLVerificationScript();
    
    console.log('\n🎉 SSL/HTTPS setup files created!');
    console.log('\n📋 Next Steps:');
    console.log('1. 🌐 Set up your domain DNS to point to your server');
    console.log('2. 📋 Copy nginx-globalscout.conf to /etc/nginx/sites-available/globalscout');
    console.log('3. 🔒 Run ./setup-letsencrypt.sh on your production server');
    console.log('4. 🔍 Verify SSL with: node verify-ssl.js your-domain.com');
    
    console.log('\n📚 Documentation:');
    console.log('- nginx-globalscout.conf: Nginx configuration with SSL');
    console.log('- setup-letsencrypt.sh: Automated SSL certificate setup');
    console.log('- verify-ssl.js: SSL certificate verification tool');
    
    console.log('\n⚠️  Important Notes:');
    console.log('- Replace "your-domain.com" with your actual domain');
    console.log('- Ensure your domain DNS points to your server before running SSL setup');
    console.log('- Set up automatic certificate renewal with cron');
}

// Run the SSL setup
setupSSL();