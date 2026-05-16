#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting MergeMind Setup..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Setup environment variables
if [ ! -f .env ]; then
    echo "📄 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️ Please fill in the values in your .env file!"
else
    echo "✅ .env file already exists."
fi

# 3. Generate Prisma Client
echo "💎 Generating Prisma Client..."
npm run db:generate

# 4. Build shared types
echo "🏷️ Building shared types..."
npm run build -w @mergemind/shared-types

echo "✅ Setup Complete! You can now run the project with 'npm run dev'."
