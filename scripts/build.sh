#!/bin/bash

# Exit on error
set -e

echo "🏗️ Building MergeMind for Production (Docker)..."

# 1. Verify environment
if [ ! -f .env ]; then
    echo "❌ Error: .env file missing. Run scripts/setup.sh first."
    exit 1
fi

# 2. Build Production Images
echo "🐳 Building Docker images with production optimizations..."
docker-compose build --no-cache

# 3. Prune unused Docker data (optional but clean)
echo "🧹 Cleaning up builder stages..."
docker image prune -f

echo "✅ Production Build Complete!"
echo "🚀 You can start the production stack with: docker-compose up -d"
