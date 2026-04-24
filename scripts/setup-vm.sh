#!/bin/bash
set -e

echo "SoulT AI Council — VM Bootstrap"
echo "======================================"

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS via NodeSource
echo "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js
echo "Node.js $(node --version)"
echo "npm $(npm --version)"

# Install system tools
echo "Installing Docker, Nginx, Certbot, UFW, PM2..."
sudo apt install -y \
  docker.io \
  nginx \
  certbot \
  python3-certbot-nginx \
  ufw \
  git \
  curl \
  wget \
  build-essential

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Verify PM2
echo "PM2 $(pm2 --version)"

# Add current user to docker group
echo "Adding user to docker group..."
sudo usermod -aG docker $USER
echo "WARNING: Log out and log back in for docker group membership to take effect"

# Enable and start services
echo "Enabling Docker and Nginx services..."
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl enable nginx
sudo systemctl start nginx

# Create nexus-brain directory
echo "Creating /home/nexus-brain directory..."
sudo mkdir -p /home/nexus-brain
sudo chown -R $USER:$USER /home/nexus-brain
cd /home/nexus-brain

# Initialize git
echo "Initializing git repository..."
git init
git config user.email "admin@soulty.one"
git config user.name "SoulT Council"

# Create logs directory
mkdir -p /home/nexus-brain/logs

# Setup UFW firewall
echo "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "VM Bootstrap Complete!"
echo ""
echo "Next steps:"
echo "  1. Clone repo into /home/nexus-brain"
echo "  2. Create .env.local with secrets"
echo "  3. Run scripts/deploy.sh"
echo "  4. Configure Nginx (copy nginx/soulty-council.conf)"
echo "  5. Point domain DNS to this VM"
echo "  6. Run certbot for SSL"
echo ""
echo "Current user: $USER"
echo "IP address: $(hostname -I)"
