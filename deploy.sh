#!/bin/bash

# Deployment script for AWS EC2
# Make sure to run this script from your local machine

set -e

echo "🚀 Starting deployment to AWS EC2..."

# Build the web version
echo "📦 Building web version..."
npx expo export --platform web

# Create deployment package
echo "📁 Creating deployment package..."
tar -czf mathtrack-app.tar.gz dist/

# Upload to server
echo "⬆️ Uploading to server..."
scp -i mercury.pem mathtrack-app.tar.gz ubuntu@ec2-52-65-230-208.ap-southeast-2.compute.amazonaws.com:~/

# Deploy on server
echo "🔧 Deploying on server..."
ssh -i mercury.pem ubuntu@ec2-52-65-230-208.ap-southeast-2.compute.amazonaws.com << 'EOF'
    # Install nginx if not installed
    sudo apt update
    sudo apt install -y nginx
    
    # Stop nginx
    sudo systemctl stop nginx
    
    # Backup existing files
    sudo rm -rf /var/www/html.backup
    sudo mv /var/www/html /var/www/html.backup 2>/dev/null || true
    
    # Extract new files
    cd ~
    tar -xzf mathtrack-app.tar.gz
    sudo mv dist /var/www/html
    
    # Set permissions
    sudo chown -R www-data:www-data /var/www/html
    sudo chmod -R 755 /var/www/html
    
    # Configure nginx for SPA
    sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINX_CONFIG'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINX_CONFIG
    
    # Start nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Clean up
    rm -f mathtrack-app.tar.gz
    
    echo "✅ Deployment completed!"
    echo "🌐 Your app is now available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
EOF

# Clean up local files
rm -f mathtrack-app.tar.gz

echo "🎉 Deployment completed successfully!"
echo "🌐 Your app should be available at: http://ec2-52-65-230-208.ap-southeast-2.compute.amazonaws.com"