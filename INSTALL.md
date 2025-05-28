# 🛠️ TitanWAF Installation Guide

Complete installation guide for TitanWAF - Advanced Web Application Firewall

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher  
- **Git**: Latest version
- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 2GB free space

### Check Prerequisites
```bash
# Check Node.js version
node --version

# Check npm version  
npm --version

# Check Git version
git --version
```

## 🚀 Installation Methods

### Method 1: Quick Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/TitanWAF.git

# Navigate to project directory
cd TitanWAF

# Install all dependencies and start
npm run fresh-install
npm run dev
```

### Method 2: Manual Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF

# Backend dependencies
cd waf-tool/backend
npm install

# Frontend dependencies  
cd ../frontend
npm install

# Return to root directory
cd ../..

# Start the application
npm run dev
```

### Method 3: Download ZIP

1. Download ZIP from GitHub releases
2. Extract to desired location
3. Open terminal in extracted folder
4. Run installation commands

## 📦 Platform-Specific Installation

### Windows Installation

#### Prerequisites for Windows
```powershell
# Install Node.js (Option 1: Chocolatey)
choco install nodejs

# Install Node.js (Option 2: Winget)
winget install OpenJS.NodeJS

# Install Node.js (Option 3: Manual)
# Download from https://nodejs.org/en/download/
```

#### Installation Steps
```powershell
# Open PowerShell as Administrator
# Clone the repository
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF

# Install dependencies
npm run fresh-install

# Start the application
npm run dev
```

### macOS Installation

#### Prerequisites for macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Or use Node Version Manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### Installation Steps
```bash
# Clone the repository
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF

# Install dependencies
npm run fresh-install

# Start the application
npm run dev
```

### Linux Installation

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools
sudo apt-get install -y git build-essential

# Clone and install
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF
npm run fresh-install
npm run dev
```

#### CentOS/RHEL/Fedora
```bash
# Install Node.js and Git
sudo dnf install nodejs npm git
# or for older systems
sudo yum install nodejs npm git

# Clone and install
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF
npm run fresh-install
npm run dev
```

#### Arch Linux
```bash
# Install Node.js and Git
sudo pacman -S nodejs npm git

# Clone and install
git clone https://github.com/yourusername/TitanWAF.git
cd TitanWAF
npm run fresh-install
npm run dev
```

## 🐳 Docker Installation

### Docker Compose Installation
```bash
# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  titanwaf-backend:
    build: ./waf-tool/backend
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config

  titanwaf-frontend:
    build: ./waf-tool/frontend
    ports:
      - "3000:3000"
    depends_on:
      - titanwaf-backend
    environment:
      - REACT_APP_API_URL=http://localhost:3003
EOF

# Start with Docker Compose
docker-compose up -d
```

### Manual Docker Installation
```bash
# Build and run backend
cd waf-tool/backend
docker build -t titanwaf-backend .
docker run -d -p 3003:3003 --name titanwaf-backend titanwaf-backend

# Build and run frontend
cd ../frontend
docker build -t titanwaf-frontend .
docker run -d -p 3000:3000 --name titanwaf-frontend titanwaf-frontend
```

## ⚙️ Configuration

### Environment Variables (Optional)

Create `.env` files for custom configuration:

**Backend (.env)**
```env
PORT=3003
NODE_ENV=development
LOG_LEVEL=info
RATE_LIMIT_WINDOW=60000
MAX_REQUESTS_PER_WINDOW=100
BLOCK_DURATION=300000
WHITELIST_AUTO_ADD=true
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:3003
REACT_APP_WEBSOCKET_URL=ws://localhost:3003
REACT_APP_LANGUAGE=en
```

### Security Configuration

TitanWAF automatically creates these files:
- `whitelist.txt` - Trusted IP addresses
- `blacklist.txt` - Permanently blocked IPs
- `temp-blacklist.txt` - Temporarily blocked IPs

## 🏃‍♂️ Running TitanWAF

### Development Mode (Recommended for Testing)
```bash
# Start both frontend and backend simultaneously
npm run dev
```

### Production Mode
```bash
# Build production version
npm run build

# Start production server
npm start
```

### Manual Start (Alternative)
```bash
# Terminal 1 - Backend
cd waf-tool/backend
npm run dev

# Terminal 2 - Frontend  
cd waf-tool/frontend
npm start
```

## 🌐 Access Points

After successful installation:

- **Admin Panel**: http://localhost:3000
- **API Server**: http://localhost:3003
- **Health Check**: http://localhost:3003/api/waf/health

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
npx kill-port 3000 3003
```

#### Permission Errors
```bash
# Fix npm permissions (Linux/macOS)
sudo chown -R $(whoami) ~/.npm

# Windows: Run PowerShell as Administrator
```

#### Node.js Version Issues
```bash
# Check current version
node --version

# Install specific version with nvm
nvm install 20
nvm use 20

# Or download from nodejs.org for Windows
```

#### Dependency Installation Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use fresh install script
npm run fresh-install
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev

# Windows PowerShell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### Log Files Location
- **WAF Logs**: `waf-log.txt`
- **Attack Logs**: `waf-suspicious-log.txt`
- **Blocked IPs**: `temp-blacklist.txt`

## 🧪 Testing Installation

### Quick Health Check
```bash
# Check if services are running
curl http://localhost:3003/api/waf/health

# Expected response: {"status":"healthy","timestamp":"..."}
```

### Security Test
```bash
# Test SQL injection detection
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR 1=1 --","password":"test"}'

# Should be blocked and logged
```

### Frontend Test
```bash
# Open browser and navigate to
# http://localhost:3000
# You should see the TitanWAF dashboard
```

## 🔄 Updates and Maintenance

### Update TitanWAF
```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies
npm run fresh-install

# Restart services
npm run dev
```

### Clean Installation
```bash
# Clean all dependencies and logs
npm run clean
npm run clean-logs

# Fresh installation
npm run fresh-install
```

## 📊 Performance Optimization

### Production Optimization
```bash
# Set production environment
export NODE_ENV=production

# Build optimized version
npm run build

# Start with PM2 for clustering
npm install -g pm2
pm2 start ecosystem.config.js
```

### Memory Optimization
```bash
# Increase heap size for large deployments
export NODE_OPTIONS="--max-old-space-size=8192"
```

## 🆘 Support

If you encounter issues:

1. **Check Prerequisites**: Ensure all requirements are met
2. **Review Logs**: Check console output for error messages
3. **GitHub Issues**: Create an issue with error details
4. **Documentation**: Review README.md for additional help

### Getting Help
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/TitanWAF/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/TitanWAF/wiki)
- **Email Support**: support@titanwaf.com

## 📚 Next Steps

After installation:
1. Access the admin panel at http://localhost:3000
2. Review the dashboard and familiarize yourself with the interface
3. Configure security settings as needed
4. Test with sample attacks to verify functionality
5. Set up monitoring and alerting

## 🎯 Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm run fresh-install`)
- [ ] Services started (`npm run dev`)
- [ ] Admin panel accessible (http://localhost:3000)
- [ ] API health check passed (http://localhost:3003/api/waf/health)
- [ ] Basic security test completed

---

**🛡️ TitanWAF is now ready to protect your applications!**

*For additional configuration and advanced features, please refer to the main [README.md](README.md) file.* 