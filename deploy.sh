#!/bin/bash

# CFIPros Frontend Deployment Script
# One-line deployment for self-hosting the CFIPros open source frontend

set -e

echo "🛩️  CFIPros Frontend Deployment"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is required but not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker detected"

# Create deployment directory
DEPLOY_DIR="cfipros-frontend-deploy"
if [ -d "$DEPLOY_DIR" ]; then
    echo "📁 Deployment directory exists. Updating..."
    cd "$DEPLOY_DIR"
    git pull
else
    echo "📁 Creating deployment directory..."
    git clone https://github.com/marcusgoll/CFIPros-frontend.git "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# Create environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating environment configuration..."
    cp .env.example .env.local
    
    echo ""
    echo "📝 Please edit .env.local with your configuration:"
    echo "   - Set your API_BASE_URL (your backend API)"
    echo "   - Configure other environment variables as needed"
    echo ""
    
    # Open editor if available
    if command -v nano &> /dev/null; then
        read -p "Would you like to edit the environment file now? (y/N): " edit_env
        if [[ $edit_env =~ ^[Yy]$ ]]; then
            nano .env.local
        fi
    fi
fi

# Create Docker Compose file for deployment
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  cfipros-frontend:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
    volumes:
      - ./public:/app/public:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Add reverse proxy for production
  # nginx:
  #   image: nginx:alpine
  #   ports:
  #     - "80:80"
  #     - "443:443"
  #   volumes:
  #     - ./nginx.conf:/etc/nginx/nginx.conf:ro
  #   depends_on:
  #     - cfipros-frontend
  #   restart: unless-stopped
EOF

# Create Dockerfile if it doesn't exist
if [ ! -f "Dockerfile" ]; then
    echo "🐳 Creating Dockerfile..."
    cat > Dockerfile << 'EOF'
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
EOF
fi

echo "🚀 Starting CFIPros Frontend..."

# Build and start containers
docker-compose up -d --build

echo ""
echo "🎉 CFIPros Frontend is now running!"
echo ""
echo "📱 Access your instance at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/health"
echo ""
echo "📚 Next steps:"
echo "   1. Configure your .env.local file with your API backend"
echo "   2. Set up SSL/TLS for production (recommended)"
echo "   3. Configure domain name and DNS"
echo "   4. Set up backup procedures for user data"
echo ""
echo "📖 Documentation: https://docs.cfipros.com/self-hosting"
echo "🆘 Support: https://github.com/marcusgoll/CFIPros-frontend/discussions"
echo ""
echo "✈️  Happy training!"
EOF