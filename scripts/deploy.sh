#!/bin/bash
set -e

APP_DIR="/home/nexus-brain"
APP_NAME="soulty-council"

echo "=== SoulT AI Council — Deploy ==="
echo "Directory: $APP_DIR"
echo ""

cd "$APP_DIR"

# ── Pull latest code ─────────────────────────────────────────────────────────
echo "[1/4] Pulling latest code..."
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "  ERROR: No git repository found at $APP_DIR"
  echo "  Run: git init && git remote add origin <your-repo-url>"
  exit 1
fi

REMOTE=$(git remote 2>/dev/null | head -1)
if [ -z "$REMOTE" ]; then
  echo "  No remote configured — skipping pull (code must be pushed via rsync or scp)"
else
  echo "  Pulling from remote: $REMOTE"
  git pull "$REMOTE" "$(git rev-parse --abbrev-ref HEAD)"
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

# Configure PM2 to start on system reboot
echo ""
echo "  Configuring PM2 to auto-start on reboot..."
STARTUP_CMD=$(pm2 startup 2>&1 | grep "sudo env")
if [ -n "$STARTUP_CMD" ]; then
  echo "  Running: $STARTUP_CMD"
  eval "$STARTUP_CMD"
  echo "  ✓ PM2 startup configured"
else
  echo "  WARNING: Could not auto-configure PM2 startup."
  echo "  Run the following manually to enable auto-start on reboot:"
  pm2 startup
fi

echo ""
echo "✓ Deploy complete"
echo ""
pm2 list
echo ""
echo "Verify: curl http://localhost:5000"
