# 🚀 TitanWAF Deployment Guide

This guide covers various deployment options for TitanWAF in production environments.

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18+ installed on target system
- [ ] Required ports (3000, 3003) available
- [ ] SSL certificates ready (for HTTPS)
- [ ] Database backup (if applicable)
- [ ] Environment variables configured
- [ ] Security groups/firewall rules configured

## 🐳 Docker Deployment (Recommended)

### Quick Docker Deployment
```bash
# Clone the repository
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
```

### Production Docker Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

### Docker Swarm Deployment
```bash
# Initialize swarm (if not already done)
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml titanwaf

# Check services
docker service ls
```

## ☁️ Cloud Platform Deployment

### AWS Deployment

#### EC2 Instance
```bash
# Launch EC2 instance (Ubuntu 22.04 LTS)
# Security Group: Allow ports 22, 80, 443, 3000, 3003

# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Deploy TitanWAF
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF
docker-compose up -d
```

#### ECS Deployment
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name titanwaf-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service --cluster titanwaf-cluster --service-name titanwaf-service --task-definition titanwaf:1 --desired-count 2
```

### Google Cloud Platform

#### Compute Engine
```bash
# Create VM instance
gcloud compute instances create titanwaf-instance \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --tags=http-server,https-server

# SSH to instance
gcloud compute ssh titanwaf-instance

# Install and deploy
sudo apt update && sudo apt install -y docker.io docker-compose
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF
sudo docker-compose up -d
```

#### Google Kubernetes Engine (GKE)
```bash
# Create GKE cluster
gcloud container clusters create titanwaf-cluster --num-nodes=3

# Deploy to Kubernetes
kubectl apply -f k8s/
```

### Microsoft Azure

#### Virtual Machine
```bash
# Create resource group
az group create --name TitanWAF-RG --location eastus

# Create VM
az vm create \
  --resource-group TitanWAF-RG \
  --name TitanWAF-VM \
  --image UbuntuLTS \
  --admin-username azureuser \
  --generate-ssh-keys

# Open ports
az vm open-port --port 3000 --resource-group TitanWAF-RG --name TitanWAF-VM
az vm open-port --port 3003 --resource-group TitanWAF-RG --name TitanWAF-VM
```

## 🖥️ Traditional Server Deployment

### Ubuntu/Debian Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF
npm run fresh-install

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### CentOS/RHEL Server
```bash
# Install Node.js
sudo dnf install -y nodejs npm git

# Install PM2
sudo npm install -g pm2

# Deploy application
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF
npm run fresh-install
pm2 start ecosystem.config.js
```

### Windows Server
```powershell
# Install Node.js (download from nodejs.org)
# Install Git (download from git-scm.com)

# Clone repository
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF

# Install dependencies
npm run fresh-install

# Install PM2
npm install -g pm2
npm install -g pm2-windows-service

# Start service
pm2 start ecosystem.config.js
pm2-service-install
```

## 🔧 Production Configuration

### Environment Variables
```bash
# Backend (.env)
NODE_ENV=production
PORT=3003
LOG_LEVEL=warn
RATE_LIMIT_WINDOW=60000
MAX_REQUESTS_PER_WINDOW=1000
BLOCK_DURATION=300000
WHITELIST_AUTO_ADD=true

# Frontend (.env)
REACT_APP_API_URL=https://your-domain.com:3003
REACT_APP_WEBSOCKET_URL=wss://your-domain.com:3003
REACT_APP_LANGUAGE=en
```

### PM2 Ecosystem Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'titanwaf-backend',
      cwd: './waf-tool/backend',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    },
    {
      name: 'titanwaf-frontend',
      cwd: './waf-tool/frontend',
      script: 'serve',
      args: '-s build -l 3000',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

## 🔒 SSL/HTTPS Configuration

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Let's Encrypt SSL
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring and Logging

### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart services
pm2 restart all

# Reload with zero downtime
pm2 reload all
```

### Log Management
```bash
# Rotate logs
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Health Monitoring
```bash
# Add health check script
#!/bin/bash
# health-check.sh

BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/api/waf/health)
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ $BACKEND_HEALTH -eq 200 ] && [ $FRONTEND_HEALTH -eq 200 ]; then
    echo "TitanWAF is healthy"
    exit 0
else
    echo "TitanWAF health check failed"
    exit 1
fi

# Add to crontab for monitoring
# */5 * * * * /path/to/health-check.sh
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# Backup configuration files
tar -czf titanwaf-backup-$(date +%Y%m%d).tar.gz \
  whitelist.txt blacklist.txt temp-blacklist.txt \
  waf-log.txt waf-suspicious-log.txt \
  .env

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/titanwaf"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/titanwaf-$DATE.tar.gz \
  whitelist.txt blacklist.txt temp-blacklist.txt \
  waf-log.txt waf-suspicious-log.txt

# Keep only last 30 days
find $BACKUP_DIR -name "titanwaf-*.tar.gz" -mtime +30 -delete
```

### Disaster Recovery
```bash
# Stop services
pm2 stop all

# Restore from backup
tar -xzf titanwaf-backup-YYYYMMDD.tar.gz

# Restart services
pm2 start ecosystem.config.js
```

## 🚀 Performance Optimization

### System Optimization
```bash
# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### Node.js Optimization
```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable cluster mode
pm2 start ecosystem.config.js --instances max
```

## 🆘 Troubleshooting

### Common Issues
```bash
# Port conflicts
sudo netstat -tulpn | grep :3000
sudo kill -9 <PID>

# Permission issues
sudo chown -R $USER:$USER /path/to/titanwaf

# Memory issues
free -h
pm2 restart all

# Disk space
df -h
sudo journalctl --vacuum-time=7d
```

### Log Analysis
```bash
# Check application logs
pm2 logs titanwaf-backend --lines 100

# Check system logs
sudo journalctl -u nginx -f

# Check error logs
tail -f waf-suspicious-log.txt
```

## 📞 Support

For deployment issues:
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/TitanWAF/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/TitanWAF/wiki)
- **Email**: support@titanwaf.com

---

**🛡️ TitanWAF Production Deployment Complete!**

*Your web applications are now protected by enterprise-grade security.* 