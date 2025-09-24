#!/bin/bash

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
sudo certbot certonly --standalone \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
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
fi