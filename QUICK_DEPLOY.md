# Quick VPS Deployment Guide (Without Nginx)

## Trên VPS

### 1. Cài Docker (nếu chưa có)
```bash
# Update system
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2. Clone project
```bash
cd ~
git clone https://github.com/your-repo/DTC-Workflow-Manager.git
cd DTC-Workflow-Manager
```

### 3. Cấu hình .env
```bash
cp .env.production .env
nano .env
```

Cập nhật các giá trị:
```bash
# Generate JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Set CORS to allow all (for dev) or specific domain
CORS_ORIGIN=*

# Add your Lark credentials
LARK_APP_ID=cli_xxxxx
LARK_APP_SECRET=xxxxx
LARK_BASE_ID=bascnxxxxx
LARK_REPORT_TABLE_ID=tblxxxxx

# Add Gemini API key
GEMINI_API_KEY=your-key
```

### 4. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### 5. Kiểm tra
```bash
# Check services
docker compose ps

# View logs
docker compose logs -f backend

# Test API
curl http://localhost:3001/api/health
```

## Trên Local (Frontend Dev Server)

### 1. Cập nhật .env.local
```bash
# Point to VPS backend
VITE_API_URL=http://YOUR_VPS_IP:3001/api
VITE_WS_URL=ws://YOUR_VPS_IP:3001
```

### 2. Chạy frontend
```bash
npm run dev
```

Truy cập: `http://localhost:5173`

## Lệnh hữu ích

```bash
# View logs
docker compose logs -f

# Restart backend
docker compose restart backend

# Stop all
docker compose down

# Update code and redeploy
git pull
./deploy.sh

# Backup database
docker compose exec postgres pg_dump -U dtc_user dtc_workflow > backup.sql

# Access database
docker compose exec postgres psql -U dtc_user -d dtc_workflow
```

## Troubleshooting

### Port 3001 không accessible từ bên ngoài
```bash
# Mở firewall
sudo ufw allow 3001/tcp
sudo ufw reload
```

### CORS errors
Đảm bảo `CORS_ORIGIN=*` trong `.env` trên VPS

### Database connection errors
```bash
# Check postgres is running
docker compose ps postgres

# View postgres logs
docker compose logs postgres
```
