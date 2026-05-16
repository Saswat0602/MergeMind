# 🚀 MergeMind Setup Guide

Welcome to MergeMind! Follow these steps to get your development environment up and running.

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v10 or higher
- **Docker & Docker Compose**: For running the database and cache
- **PostgreSQL**: (If not using Docker)
- **Redis**: (If not using Docker)

## 🛠️ Step-by-Step Installation

### 1. Initial Setup
Run the automated setup script to install dependencies and configure your environment:
```bash
bash scripts/setup.sh
```

### 2. Configure Environment Variables
Open the `.env` file at the root of the project and fill in the following:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `REDIS_URL`: Your Redis connection string.
- `OPENROUTER_API_KEY`: Your OpenRouter API key.
- `GITHUB_WEBHOOK_SECRET`: A secret for validating GitHub webhooks.

### 3. Database Migration
Apply the database schema to your local database:
```bash
npm run db:migrate:dev -- --name init
```

### 4. Running the Project
Start the development server for all apps:
```bash
npm run dev
```

The API will be available at `http://localhost:3000` and the Dashboard at `http://localhost:3001`.
