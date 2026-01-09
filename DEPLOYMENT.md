# DTC Workflow Manager - VPS Deployment Guide

Complete guide for deploying DTC Workflow Manager to a VPS using Docker.

## Prerequisites

- VPS with Ubuntu 20.04+ (or Debian-based Linux)
- Root or sudo access
- At least 2GB RAM, 20GB disk space
- Domain name (optional, but recommended for SSL)

## Quick Start

### 1. Prepare Your VPS

SSH into your VPS:
```bash
ssh root@your-vps-ip
```

Download and run the setup script:
```bash
curl -o setup-vps.sh https://raw.githubusercontent.com/your-repo/DTC-Workflow-Manager/main/setup-vps.sh
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

Or manually copy the `setup-vps.sh` script and run:
```bash
sudo bash setup-vps.sh
```

### 2. Upload Project Files

From your local machine, upload the project to VPS:

**Option A: Using Git (Recommended)**
```bash
ssh root@your-vps-ip
cd /opt/dtc-workflow-manager
git clone https://github.com/your-repo/DTC-Workflow-Manager.git .
```

**Option B: Using SCP**
```bash
# From your local machine
scp -r DTC-Workflow-Manager/* root@your-vps-ip:/opt/dtc-workflow-manager/
```

**Option C: Using rsync**
```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.git' DTC-Workflow-Manager/ root@your-vps-ip:/opt/dtc-workflow-manager/
```

### 3. Configure Environment Variables

SSH into your VPS and configure the environment:
```bash
ssh root@your-vps-ip
cd /opt/dtc-workflow-manager
cp .env.production .env
nano .env
```

**Required configurations:**

1. **Generate JWT Secrets:**
```bash
# Generate strong secrets
openssl rand -base64 32
# Copy output and paste into JWT_SECRET

openssl rand -base64 32
# Copy output and paste into JWT_REFRESH_SECRET
```

2. **Set CORS Origin:**
```bash
# If using domain:
CORS_ORIGIN=http://your-domain.com

# If using IP only:
CORS_ORIGIN=http://123.456.789.012
```

3. **Add Lark Credentials:**
   - Get from https://open.feishu.cn/app
   - Fill in `LARK_APP_ID`, `LARK_APP_SECRET`, `LARK_BASE_ID`, `LARK_REPORT_TABLE_ID`

4. **Add Gemini API Key:**
   - Get from https://aistudio.google.com/app/apikey
   - Fill in `GEMINI_API_KEY`

### 4. Deploy the Application

```bash
cd /opt/dtc-workflow-manager
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Build Docker images
- Start all services (PostgreSQL, Backend, Frontend)
- Run database migrations
- Seed initial data

### 5. Verify Deployment

Check if all services are running:
```bash
docker-compose ps
```

You should see:
- ✅ dtc-postgres (healthy)
- ✅ dtc-backend (running)
- ✅ dtc-frontend (running)

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 6. Access the Application

Open your browser:
- **Using IP:** `http://your-vps-ip`
- **Using domain:** `http://your-domain.com`

Default login credentials:
| Role | Email | Password |
|------|-------|----------|
| Manager | manager@dtc.com | manager123 |
| Designer | tu@dtc.com | designer123 |
| Seller | huyen@dtc.com | seller123 |
| CS | dao@dtc.com | cs123 |

## SSL/HTTPS Setup (Recommended)

### Using Certbot with Let's Encrypt

1. **Install Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. **Stop the frontend container:**
```bash
docker-compose stop frontend
```

3. **Get SSL certificate:**
```bash
sudo certbot certonly --standalone -d your-domain.com
```

4. **Create nginx SSL configuration:**

Create `nginx-ssl.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of nginx config (copy from nginx.conf)
}
```

5. **Update docker-compose.yml for SSL:**
```yaml
frontend:
  # ... existing config
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf
```

6. **Update CORS_ORIGIN in .env:**
```bash
CORS_ORIGIN=https://your-domain.com
```

7. **Restart services:**
```bash
docker-compose up -d
```

## Domain Setup

### Configure DNS

Point your domain to your VPS IP:

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add an A record:
   - **Type:** A
   - **Name:** @ (or subdomain)
   - **Value:** Your VPS IP address
   - **TTL:** 3600

Wait for DNS propagation (5-30 minutes).

## Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application
```bash
cd /opt/dtc-workflow-manager

# Pull latest changes
git pull

# Rebuild and restart
./deploy.sh
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U dtc_user dtc_workflow > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U dtc_user dtc_workflow < backup_20260109.sql
```

### Stop Services
```bash
docker-compose down
```

### Remove All Data (CAUTION!)
```bash
docker-compose down -v  # This will delete the database!
```

## Troubleshooting

### Services Won't Start

Check logs:
```bash
docker-compose logs
```

Check if ports are available:
```bash
sudo netstat -tulpn | grep -E ':(80|443|3001|5432)'
```

### Database Connection Issues

Check if PostgreSQL is healthy:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

Manually test connection:
```bash
docker-compose exec postgres psql -U dtc_user -d dtc_workflow
```

### Frontend Not Loading

Check nginx logs:
```bash
docker-compose logs frontend
```

Verify backend is accessible:
```bash
curl http://localhost:3001/api/health
```

### Lark Notifications Not Working

1. Check Lark credentials in `.env`
2. Verify bot permissions in Lark app dashboard
3. Check backend logs:
```bash
docker-compose logs backend | grep -i lark
```

### Out of Disk Space

Check disk usage:
```bash
df -h
```

Clean up Docker:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a
```

## Performance Optimization

### Increase Container Resources

Edit `docker-compose.yml`:
```yaml
backend:
  # ... existing config
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### Enable Nginx Caching

Add to `nginx.conf`:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... rest of config
}
```

## Security Best Practices

1. **Change default passwords** immediately after first login
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable SSL/HTTPS** for production
4. **Keep Docker updated:**
   ```bash
   sudo apt-get update
   sudo apt-get upgrade docker-ce docker-ce-cli containerd.io
   ```
5. **Regular backups** of database
6. **Monitor logs** for suspicious activity
7. **Use firewall** (UFW is configured by setup script)

## Monitoring

### Check Service Health
```bash
# All services
docker-compose ps

# Detailed stats
docker stats
```

### Monitor Logs in Real-time
```bash
# All services
docker-compose logs -f

# Filter for errors
docker-compose logs -f | grep -i error
```

### Database Size
```bash
docker-compose exec postgres psql -U dtc_user -d dtc_workflow -c "SELECT pg_size_pretty(pg_database_size('dtc_workflow'));"
```

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Review this guide's troubleshooting section
3. Check GitHub issues
4. Contact DTC team

---

**Built with ❤️ for DTC Team**
