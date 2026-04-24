#!/bin/bash
set -e

APP_DIR="/home/nexus-brain"
APP_NAME="soulty-council"

echo "=== SoulT AI Council — Deploy ==="
echo "Directory: $APP_DIR"
echo ""

cd "$APP_DIR"

# ── Pull latest code ─────────────────────────────────────────────────────────
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "[1/4] Pulling latest code..."
  git pull || echo "  (no remote configured — skipping pull)"
else
  echo "[1/4] No git repo found, skipping pull..."
fi

# ── Install dependencies ─────────────────────────────────────────────────────
echo "[2/4] Installing dependencies..."
npm install --production=false

# ── Build Next.js ────────────────────────────────────────────────────────────
echo "[3/4] Building Next.js app..."
NODE_ENV=production npm run build

# ── Start or reload PM2 ──────────────────────────────────────────────────────
echo "[4/4] Starting/reloading PM2..."
if pm2 list | grep -q "$APP_NAME"; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi

pm2 save
pm2 startup | tail -1 | bash || true

echo ""
echo "✓ Deploy complete"
echo ""
pm2 list
echo ""
echo "Verify: curl http://localhost:5000"
