#!/bin/bash

# DTC Workflow Manager - VPS Setup Script
# This script prepares a fresh VPS for Docker deployment

set -e

echo "======================================"
echo "DTC Workflow Manager - VPS Setup"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
echo "✅ Firewall configured"

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /opt/dtc-workflow-manager
chown -R $SUDO_USER:$SUDO_USER /opt/dtc-workflow-manager
echo "✅ Application directory created: /opt/dtc-workflow-manager"

# Create logs directory
mkdir -p /opt/dtc-workflow-manager/server/logs
mkdir -p /opt/dtc-workflow-manager/server/uploads
chown -R $SUDO_USER:$SUDO_USER /opt/dtc-workflow-manager/server

echo ""
echo "======================================"
echo "✅ VPS Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Copy your project files to /opt/dtc-workflow-manager"
echo "2. Configure .env file with production values"
echo "3. Run ./deploy.sh to start the application"
echo ""
echo "Useful commands:"
echo "  - Check Docker: docker --version"
echo "  - Check Docker Compose: docker-compose --version"
echo "  - View firewall status: ufw status"
echo ""
