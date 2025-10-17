# Deployment Guide

**Date:** October 17, 2024  
**Status:** ✅ Production Ready  
**Platform:** Vercel (Recommended) / Self-hosted

---

## Prerequisites

### Vercel Deployment
- Vercel account (free tier available)
- GitHub repository connected
- Environment variables configured

### Self-hosted Deployment
- Node.js 18+
- Python 3.8+
- 16GB RAM minimum
- 50GB disk space (for model)
- Docker (optional)

---

## Part 1: Vercel Deployment

### Step 1: Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel
```

### Step 2: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
PYTHON_API_URL=https://your-python-api.com
MODEL_PATH=/tmp/model
TRANSLATION_CACHE_SIZE=1000
LOG_LEVEL=info
```

### Step 3: Handle Model Files

**Issue:** IndicTrans2 model (7.6GB) exceeds Vercel's 250MB limit

**Solution 1: Model Serving from CDN**

```typescript
// lib/translation/model-loader.ts
import axios from 'axios';

async function loadModelFromCDN() {
  const modelUrl = process.env.MODEL_CDN_URL;
  
  // Download model on first use
  const modelPath = '/tmp/model';
  
  if (!fs.existsSync(modelPath)) {
    console.log('Downloading model from CDN...');
    const response = await axios.get(modelUrl, {
      responseType: 'stream',
    });
    
    const writer = fs.createWriteStream(modelPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
  
  return modelPath;
}
```

**Solution 2: Separate Python Backend**

Deploy Python inference server separately:

```bash
# Deploy to Hugging Face Spaces, AWS Lambda, or Railway
# Python server handles model loading and inference
# Next.js frontend calls Python API
```

**Solution 3: Model Quantization**

```bash
# Reduce model size from 7.6GB to ~2GB
python scripts/quantize-model.py
```

### Step 4: Configure Build Settings

In `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@next_public_api_url",
    "PYTHON_API_URL": "@python_api_url"
  },
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

### Step 5: Deploy

```bash
# Deploy to production
vercel --prod

# Expected output:
# ✓ Production: https://your-domain.vercel.app
```

---

## Part 2: Self-hosted Deployment

### Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Python
RUN apk add --no-cache python3 py3-pip

# Copy dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Download model
RUN pnpm tsx scripts/download-model.ts

# Expose port
EXPOSE 3000

# Start
CMD ["pnpm", "start"]
```

#### Step 2: Build and Run

```bash
# Build image
docker build -t indic-translator:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  -e PYTHON_API_URL=http://localhost:5000 \
  indic-translator:latest

# With volume for model persistence
docker run -p 3000:3000 \
  -v /data/models:/app/models \
  indic-translator:latest
```

#### Step 3: Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
      PYTHON_API_URL: http://localhost:5000
    volumes:
      - ./models:/app/models
    depends_on:
      - backend

  backend:
    image: python:3.10
    working_dir: /app
    command: python -m uvicorn main:app --host 0.0.0.0 --port 5000
    ports:
      - "5000:5000"
    volumes:
      - ./scripts/inference:/app
      - ./models:/app/models
    environment:
      MODEL_PATH: /app/models

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
```

### AWS Deployment

#### Step 1: Create EC2 Instance

```bash
# Launch t3.xlarge instance (16GB RAM)
# Ubuntu 22.04 LTS
# Security group: Allow 80, 443, 22
```

#### Step 2: Setup Server

```bash
# SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y nodejs npm python3 python3-pip git

# Install pnpm
npm install -g pnpm

# Clone repository
git clone https://github.com/user/indic-translator.git
cd indic-translator

# Install dependencies
pnpm install

# Download model
pnpm tsx scripts/download-model.ts

# Build
pnpm build
```

#### Step 3: Setup PM2 for Process Management

```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'indic-translator',
    script: 'pnpm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: 'https://your-domain.com',
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

#### Step 4: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/indic-translator > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/indic-translator /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## Part 3: Environment Variables

### Required Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com
PYTHON_API_URL=https://python-api.your-domain.com
NODE_ENV=production

# Translation Service
TRANSLATION_CACHE_SIZE=1000
TRANSLATION_TIMEOUT=30000
TRANSLATION_MAX_LENGTH=5000

# Model Configuration
MODEL_PATH=/data/models
MODEL_CACHE_SIZE=2000
MODEL_BATCH_SIZE=4

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Database (if applicable)
DATABASE_URL=postgresql://user:pass@host/db

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
```

### Optional Variables

```bash
# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CACHING=true
ENABLE_TRANSLATION_HISTORY=true

# Performance
CACHE_TTL=3600
COMPRESSION_LEVEL=6

# Debugging
DEBUG=false
VERBOSE_LOGGING=false
```

---

## Part 4: Monitoring & Logging

### Application Monitoring

```typescript
// lib/monitoring/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Error Tracking with Sentry

```typescript
// pages/_app.tsx
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Performance Monitoring

```typescript
// lib/monitoring/performance.ts
export function trackTranslationPerformance(duration: number, language: string) {
  // Send to analytics
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({
      metric: 'translation_duration',
      value: duration,
      language,
      timestamp: new Date(),
    }),
  });
}
```

---

## Part 5: Troubleshooting

### Issue: Model Download Fails

```bash
# Solution 1: Check disk space
df -h

# Solution 2: Download manually
wget https://huggingface.co/models/indictrans2/pytorch_model.bin -O models/model.bin

# Solution 3: Use quantized model
pnpm tsx scripts/quantize-model.ts
```

### Issue: High Memory Usage

```bash
# Solution 1: Reduce batch size
TRANSLATION_BATCH_SIZE=1

# Solution 2: Enable model quantization
MODEL_QUANTIZATION=true

# Solution 3: Increase swap
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Issue: Slow Response Times

```bash
# Solution 1: Enable caching
ENABLE_CACHING=true
CACHE_TTL=3600

# Solution 2: Use CDN
NEXT_PUBLIC_CDN_URL=https://cdn.your-domain.com

# Solution 3: Optimize model
pnpm tsx scripts/optimize-model.ts
```

### Issue: CORS Errors

```typescript
// pages/api/translate.ts
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle request
}
```

---

## Part 6: Post-Deployment

### Health Checks

```bash
# Check application
curl https://your-domain.com/api/health

# Expected response:
# { "status": "ok", "version": "1.0.0" }
```

### Monitoring Dashboard

```bash
# View logs
pm2 logs indic-translator

# Monitor resources
pm2 monit

# View metrics
curl https://your-domain.com/api/metrics
```

### Backup Strategy

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Backup models
tar -czf models-backup.tar.gz models/

# Backup configuration
tar -czf config-backup.tar.gz .env
```

---

## Summary

✅ **Deployment Ready**

**Vercel:**
- Quick setup
- Automatic scaling
- Free tier available
- Model serving required

**Self-hosted:**
- Full control
- Better performance
- Higher cost
- More maintenance

**Recommended:** Start with Vercel for frontend, separate Python backend for model inference

---

*Last Updated: October 17, 2024*
