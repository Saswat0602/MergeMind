# Base stage for pruning
FROM node:20-slim AS pruner
RUN apt-get update && apt-get install -y libc6
RUN npm install -g turbo
WORKDIR /app
COPY . .
RUN turbo prune @mergemind/api --docker

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
RUN npx turbo build --filter=@mergemind/api...

# Runner stage
FROM node:20-slim AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=builder /app/package.json .
COPY --from=builder /app/package-lock.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "apps/api/dist/main.js"]
