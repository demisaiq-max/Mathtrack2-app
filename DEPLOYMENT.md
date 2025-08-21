# AWS Deployment Guide for MathTrack App

## Prerequisites

1. **AWS EC2 Instance**: Your instance is running at `ec2-52-65-230-208.ap-southeast-2.compute.amazonaws.com`
2. **SSH Access**: You have the `mercury.pem` key file
3. **Node.js & npm/bun**: Installed locally for building

## Quick Deployment (Automated)

### Step 1: Prepare Files
```bash
# Make the deployment script executable
chmod +x deploy.sh

# Set correct permissions for PEM key
chmod 400 mercury.pem
```

### Step 2: Deploy
```bash
# Run the automated deployment script
./deploy.sh
```

This script will:
- Build your Expo web app
- Upload it to your AWS server
- Configure Nginx
- Start the web server

## Manual Deployment (Step by Step)

### Step 1: Build the App Locally
```bash
# Build for web platform
npx expo export --platform web
```

### Step 2: Upload to Server
```bash
# Create archive
tar -czf mathtrack-app.tar.gz dist/

# Upload to server
scp -i mercury.pem mathtrack-app.tar.gz ubuntu@ec2-52-65-230-208.ap-southeast-2.compute.amazonaws.com:~/
```

### Step 3: Connect to Server
```bash
ssh -i mercury.pem ubuntu@ec2-52-65-230-208.ap-southeast-2.compute.amazonaws.com
```

### Step 4: Install Nginx (on server)
```bash
sudo apt update
sudo apt install -y nginx
```

### Step 5: Deploy Files (on server)
```bash
# Extract files
tar -xzf mathtrack-app.tar.gz

# Move to web directory
sudo rm -rf /var/www/html
sudo mv dist /var/www/html

# Set permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### Step 6: Configure Nginx (on server)
```bash
sudo nano /etc/nginx/sites-available/default
```

Replace content with:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    # Handle client-side routing for React Router
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
```

### Step 7: Start Nginx (on server)
```bash
# Test configuration
sudo nginx -t

# Start/restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## Access Your App

Your app will be available at:
- **HTTP**: http://ec2-52-65-230-208.ap-southeast-2.compute.amazonaws.com
- **IP**: http://52.65.230.208

## Environment Variables

Make sure your Supabase configuration works with the deployed domain. You may need to:

1. **Update Supabase Settings**:
   - Add your AWS domain to allowed origins
   - Update redirect URLs if using authentication

2. **Check Environment Variables**:
   - Ensure `.env` variables are properly configured for production
   - Consider using environment-specific configs

## SSL Certificate (Optional but Recommended)

To enable HTTPS:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Troubleshooting

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check File Permissions
```bash
ls -la /var/www/html/
```

### Firewall Settings
```bash
# Allow HTTP traffic
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Updating the App

To update your deployed app:

1. Make changes locally
2. Run `./deploy.sh` again
3. The script will automatically backup and replace files

## Alternative: Docker Deployment

If you prefer Docker, create a `Dockerfile`:

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Then build and run:
```bash
docker build -t mathtrack-app .
docker run -p 80:80 mathtrack-app
```