#!/bin/bash
set -e

echo "=== SoulT AI Council — Nexus Brain VM Setup ==="
echo "Target: Ubuntu 22.04 LTS on GCP (e2-standard-4)"
echo ""

# ── System update ────────────────────────────────────────────────────────────
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ── Node.js 20 via NodeSource ────────────────────────────────────────────────
echo "[2/8] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "  node: $(node --version)"
echo "  npm:  $(npm --version)"

# ── Tools: git, docker, nginx, certbot, ufw ──────────────────────────────────
echo "[3/8] Installing git, Docker, Nginx, Certbot, UFW..."
sudo apt install -y git docker.io nginx certbot python3-certbot-nginx ufw

# ── Docker group + service ───────────────────────────────────────────────────
echo "[4/8] Configuring Docker..."
sudo usermod -aG docker "$USER"
sudo systemctl start docker
sudo systemctl enable docker

# ── Nginx service ────────────────────────────────────────────────────────────
echo "[5/8] Configuring Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# ── PM2 ─────────────────────────────────────────────────────────────────────
echo "[6/8] Installing PM2 globally..."
sudo npm install -g pm2

echo "  pm2: $(pm2 --version)"

# ── UFW firewall ─────────────────────────────────────────────────────────────
echo "[7/8] Configuring UFW firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# ── App directory ────────────────────────────────────────────────────────────
echo "[8/8] Creating app directory /home/nexus-brain..."
sudo mkdir -p /home/nexus-brain
sudo chown "$USER":"$USER" /home/nexus-brain
cd /home/nexus-brain

git init
git config user.email "admin@soulty.one"
git config user.name "Nexus Brain"

echo ""
echo "✓ Server setup complete"
echo ""
echo "Next steps:"
echo "  1. Push your code to /home/nexus-brain  (git push or rsync)"
echo "  2. Create /home/nexus-brain/.env.local  with your secrets"
echo "  3. Run: bash scripts/deploy.sh"
echo "  4. Symlink nginx config:"
echo "     sudo ln -sf /home/nexus-brain/nginx/soulty-council.conf /etc/nginx/sites-enabled/soulty-council"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo "  5. (Optional) Issue SSL cert: sudo certbot --nginx -d your-domain.com"
