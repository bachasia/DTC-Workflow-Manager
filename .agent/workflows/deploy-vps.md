---
description: Deploy DTC Workflow Manager to VPS using Docker
---

# Deploy to VPS Workflow

This workflow guides you through deploying the DTC Workflow Manager to a VPS using Docker.

## Prerequisites Check

1. Verify you have VPS access credentials (IP, SSH key/password)
2. Ensure VPS meets minimum requirements:
   - Ubuntu 20.04+ or Debian-based Linux
   - 2GB+ RAM
   - 20GB+ disk space
   - Root or sudo access

## Step 1: Prepare VPS

SSH into your VPS:
```bash
ssh root@YOUR_VPS_IP
```

Upload and run the setup script:
```bash
# Option A: If project is on GitHub
curl -o setup-vps.sh https://raw.githubusercontent.com/YOUR_REPO/DTC-Workflow-Manager/main/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh

# Option B: Upload manually via SCP
# From local machine: scp setup-vps.sh root@YOUR_VPS_IP:/root/
# Then on VPS: sudo bash setup-vps.sh
```

## Step 2: Upload Project Files

Choose one method:

**Method A: Git Clone (Recommended)**
```bash
cd /opt/dtc-workflow-manager
git clone https://github.com/YOUR_REPO/DTC-Workflow-Manager.git .
```

**Method B: SCP from local**
```bash
# From local machine
scp -r DTC-Workflow-Manager/* root@YOUR_VPS_IP:/opt/dtc-workflow-manager/
```

**Method C: rsync**
```bash
# From local machine
rsync -avz --exclude 'node_modules' --exclude '.git' DTC-Workflow-Manager/ root@YOUR_VPS_IP:/opt/dtc-workflow-manager/
```

## Step 3: Configure Environment

On VPS:
```bash
cd /opt/dtc-workflow-manager
cp .env.production .env
nano .env
```

Generate JWT secrets:
```bash
openssl rand -base64 32  # Copy for JWT_SECRET
openssl rand -base64 32  # Copy for JWT_REFRESH_SECRET
```

Update these values in `.env`:
- `JWT_SECRET` - paste first generated secret
- `JWT_REFRESH_SECRET` - paste second generated secret
- `CORS_ORIGIN` - your domain or `http://YOUR_VPS_IP`
- `LARK_APP_ID` - from Lark app dashboard
- `LARK_APP_SECRET` - from Lark app dashboard
- `LARK_BASE_ID` - from Lark Base
- `LARK_REPORT_TABLE_ID` - from Lark Base
- `GEMINI_API_KEY` - from Google AI Studio

Save and exit: `Ctrl+X`, `Y`, `Enter`

## Step 4: Deploy Application

// turbo
```bash
cd /opt/dtc-workflow-manager
chmod +x deploy.sh
./deploy.sh
```

Wait for deployment to complete (5-10 minutes).

## Step 5: Verify Deployment

Check services are running:
```bash
docker-compose ps
```

All services should show "Up" or "healthy".

View logs:
```bash
docker-compose logs --tail=50
```

## Step 6: Test Application

1. Open browser to `http://YOUR_VPS_IP`
2. Login with: `manager@dtc.com` / `manager123`
3. Verify dashboard loads
4. Create a test task
5. Check Lark notification received

## Step 7: Post-Deployment

1. Change all default passwords
2. Set up SSL/HTTPS (see DEPLOYMENT.md)
3. Configure automated backups
4. Monitor logs for first 24 hours

## Useful Commands

View logs:
```bash
docker-compose logs -f
```

Restart services:
```bash
docker-compose restart
```

Stop services:
```bash
docker-compose down
```

Update application:
```bash
git pull
./deploy.sh
```

## Troubleshooting

If services won't start:
```bash
docker-compose logs
docker-compose ps
```

If frontend not accessible:
```bash
curl http://localhost/health
docker-compose logs frontend
```

For more help, see DEPLOYMENT.md troubleshooting section.
