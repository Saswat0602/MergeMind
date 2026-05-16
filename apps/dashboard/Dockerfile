# Base stage for pruning
FROM node:20-slim AS pruner
RUN apt-get update && apt-get install -y libc6
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune @mergemind/dashboard --docker

# Builder stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy pruned workspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

# Build the project
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo build --filter=@mergemind/dashboard...

# Runner stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static

EXPOSE 3001

ENV PORT=3001
CMD ["node", "apps/dashboard/server.js"]
