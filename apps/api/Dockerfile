# Base stage for pruning
FROM node:20-slim AS pruner
RUN apt-get update && apt-get install -y libc6 openssl
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune @mergemind/api --docker

# Builder stage
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN npx turbo build --filter=@mergemind/api...

# Runner stage
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy only what's needed to install production deps
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install --omit=dev

# Copy built artifacts and shared packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json

# Regenerate Prisma Client in the runner to ensure perfect sync
RUN cd packages/database && npx prisma generate

USER nestjs
EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "apps/api/dist/main.js"]
