# Deploying SoulT AI Council to Nexus Brain VM (GCP)

This guide walks through deploying the app to the `nexus-brain-vm` GCP instance from scratch.

---

## 1. Create the VM

```bash
PROJECT_ID="your-gcp-project-id"
VM_NAME="nexus-brain-vm"
ZONE="us-central1-a"

gcloud config set project $PROJECT_ID

gcloud compute instances create $VM_NAME \
  --zone=$ZONE \
  --machine-type=e2-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-ssd \
  --scopes=cloud-platform \
  --tags=http-server,https-server

# Firewall rules (run once per project)
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 --source-ranges=0.0.0.0/0 --target-tags=http-server

gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 --source-ranges=0.0.0.0/0 --target-tags=https-server

# Get the external IP
gcloud compute instances describe $VM_NAME \
  --zone=$ZONE \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

---

## 2. SSH into the VM

```bash
gcloud compute ssh $VM_NAME --zone=$ZONE
```

---

## 3. Run the VM bootstrap script (first time only)

Upload or copy the contents of `scripts/setup-vm.sh` and run:

```bash
bash scripts/setup-vm.sh
```

This installs Node.js 20, Docker, Nginx, Certbot, UFW, and PM2 — and creates `/home/nexus-brain`.

> After this step, **log out and log back in** so your docker group membership takes effect:
> ```bash
> exit
> gcloud compute ssh $VM_NAME --zone=$ZONE
> ```

---

## 4. Push the code to the VM

From your **local machine**, use `rsync` or `gcloud scp` to copy the project:

```bash
# Using rsync (recommended)
rsync -avz --exclude='.next' --exclude='node_modules' --exclude='soulty.db' \
  ./ $VM_NAME:/home/nexus-brain/

# Or using gcloud scp
gcloud compute scp --recurse ./ $VM_NAME:/home/nexus-brain/ --zone=$ZONE
```

---

## 5. Configure secrets on the VM

SSH into the VM and create the env file:

```bash
nano /home/nexus-brain/.env.local
```

Paste and fill in your values:

```env
# Anthropic — required for AI features
ANTHROPIC_API_KEY=sk-ant-...

# Turso cloud DB — optional (leave blank to use local SQLite at soulty.db)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# App URL — set to your domain or VM external IP
NEXT_PUBLIC_APP_URL=http://YOUR_VM_IP_OR_DOMAIN
```

---

## 6. Deploy the app

```bash
cd /home/nexus-brain
bash scripts/deploy.sh
```

This installs dependencies, builds Next.js, and starts the app under PM2.

Verify it's running:

```bash
curl http://localhost:5000
pm2 list
```

---

## 7. Enable Nginx reverse proxy

```bash
sudo ln -sf /home/nexus-brain/nginx/soulty-council.conf \
  /etc/nginx/sites-enabled/soulty-council

# Remove the default site if it conflicts
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

The app is now reachable on **port 80** at your VM's external IP.

---

## 8. (Optional) Issue an SSL certificate with Certbot

Point your domain's DNS A-record to the VM's external IP first, then:

```bash
sudo certbot --nginx -d council.soulty.one
```

Certbot will edit the Nginx config and set up auto-renewal. Done — your app is live on HTTPS.

---

## Re-deploying after code changes

From your local machine:

```bash
# Push changes
rsync -avz --exclude='.next' --exclude='node_modules' --exclude='soulty.db' \
  ./ $VM_NAME:/home/nexus-brain/

# SSH in and redeploy
gcloud compute ssh $VM_NAME --zone=$ZONE -- "bash /home/nexus-brain/scripts/deploy.sh"
```

---

## PM2 cheatsheet

```bash
pm2 list                    # Show running apps
pm2 logs soulty-council     # Tail logs
pm2 restart soulty-council  # Restart
pm2 stop soulty-council     # Stop
pm2 monit                   # Live CPU/memory monitor
```

---

## Seed the database (first run)

After the app is running, call the seed endpoint once to populate demo data:

```bash
curl -X POST http://localhost:5000/api/seed
```
