# Quick Deployment Checklist

## Pre-Deployment
- [ ] VPS ready (Ubuntu 20.04+, 2GB+ RAM)
- [ ] Domain name configured (optional)
- [ ] Lark app credentials obtained
- [ ] Gemini API key obtained

## VPS Setup
- [ ] SSH into VPS: `ssh root@your-vps-ip`
- [ ] Run setup script: `sudo bash setup-vps.sh`
- [ ] Verify Docker installed: `docker --version`
- [ ] Verify Docker Compose installed: `docker-compose --version`

## Project Upload
- [ ] Upload project files to `/opt/dtc-workflow-manager`
- [ ] Navigate to directory: `cd /opt/dtc-workflow-manager`

## Configuration
- [ ] Copy environment file: `cp .env.production .env`
- [ ] Generate JWT secrets: `openssl rand -base64 32` (run twice)
- [ ] Edit `.env` file: `nano .env`
- [ ] Set `JWT_SECRET` (strong random string)
- [ ] Set `JWT_REFRESH_SECRET` (different strong random string)
- [ ] Set `CORS_ORIGIN` (your domain or IP)
- [ ] Set `LARK_APP_ID`
- [ ] Set `LARK_APP_SECRET`
- [ ] Set `LARK_BASE_ID`
- [ ] Set `LARK_REPORT_TABLE_ID`
- [ ] Set `GEMINI_API_KEY`
- [ ] Save and exit: `Ctrl+X`, `Y`, `Enter`

## Deployment
- [ ] Make deploy script executable: `chmod +x deploy.sh`
- [ ] Run deployment: `./deploy.sh`
- [ ] Wait for build to complete (~5-10 minutes)

## Verification
- [ ] Check services running: `docker-compose ps`
- [ ] All services show "Up" or "healthy"
- [ ] View logs: `docker-compose logs --tail=50`
- [ ] No critical errors in logs

## Testing
- [ ] Open browser to `http://your-vps-ip` or `http://your-domain.com`
- [ ] Login page loads successfully
- [ ] Login with manager account: `manager@dtc.com` / `manager123`
- [ ] Dashboard loads with data
- [ ] Create a test task
- [ ] Verify Lark notification received
- [ ] Check WebSocket connection (real-time updates work)

## Post-Deployment
- [ ] Change default passwords for all users
- [ ] Configure SSL/HTTPS (if using domain)
- [ ] Set up automated backups
- [ ] Configure monitoring/alerts
- [ ] Document VPS access credentials
- [ ] Test scheduled jobs (check logs after 1 hour)

## Optional: SSL Setup
- [ ] Install Certbot: `sudo apt-get install certbot`
- [ ] Stop frontend: `docker-compose stop frontend`
- [ ] Get certificate: `sudo certbot certonly --standalone -d your-domain.com`
- [ ] Update nginx config for SSL
- [ ] Update `CORS_ORIGIN` to `https://your-domain.com`
- [ ] Restart services: `docker-compose up -d`
- [ ] Test HTTPS access

## Troubleshooting
If issues occur:
- [ ] Check logs: `docker-compose logs -f`
- [ ] Verify `.env` configuration
- [ ] Check firewall: `sudo ufw status`
- [ ] Verify ports not in use: `sudo netstat -tulpn | grep -E ':(80|443|3001|5432)'`
- [ ] Restart services: `docker-compose restart`
- [ ] Review DEPLOYMENT.md troubleshooting section

## Success Criteria
✅ All Docker containers running
✅ Frontend accessible via browser
✅ Can login successfully
✅ Can create and view tasks
✅ Lark notifications working
✅ Real-time updates working
✅ No errors in logs
