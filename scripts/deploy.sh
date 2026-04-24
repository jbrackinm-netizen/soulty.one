#!/bin/bash
set -e

APP_DIR="/home/nexus-brain"
REPO_URL="https://github.com/jbrackinm-netizen/soulty.one.git"

echo "SoulT AI Council — Deploy Script"
echo "====================================="

# Check if running as correct user
if [ "$USER" = "root" ]; then
  echo "ERROR: Do not run this script as root"
  exit 1
fi

# Navigate to app directory
cd $APP_DIR

# Clone or pull repository
if [ -d ".git" ]; then
  echo "Pulling latest code from GitHub..."
  git pull origin main
else
  echo "Cloning repository..."
  git clone $REPO_URL .
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build Next.js app
echo "Building Next.js application..."
npm run build

# Check if build succeeded
if [ ! -d ".next" ]; then
  echo "ERROR: Build failed — .next directory not found"
  exit 1
fi

echo "Build successful"

# Stop existing PM2 process (if running)
echo "Stopping existing PM2 processes..."
pm2 delete soulty-council 2>/dev/null || true
pm2 delete nexus-brain 2>/dev/null || true

# Start with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 startup hook
echo "Setting up PM2 startup hook..."
sudo env PATH=$PATH:/usr/local/bin pm2 startup -u $USER --hp /home/$USER

echo ""
echo "Deployment Complete!"
echo ""
echo "Status:"
pm2 status
echo ""
echo "Logs:"
pm2 logs soulty-council --lines 5 --nostream
echo ""
echo "App running at http://localhost:5000"
echo "   (Behind Nginx proxy at http://your-domain.com)"
