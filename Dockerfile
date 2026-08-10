# syntax=docker/dockerfile:1
# Realvian — Next.js 15 pnpm monorepo
# Stack: pnpm 10 + Turborepo + Next.js 15 standalone output

# ── Stage 1: Install dependencies ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

# Copy workspace manifests first (layer cache: only re-install on manifest changes)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/marketing/package.json ./apps/marketing/package.json
COPY packages/db/package.json ./packages/db/package.json

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

# Pull in installed modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/marketing/node_modules ./apps/marketing/node_modules

# Copy the rest of the source
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm run build

# ── Stage 3: Minimal production runner ─────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Container always listens on 3000; CloudPanel maps host 8478 → 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js standalone bundles its own trimmed node_modules —
# no install needed at runtime
COPY --from=builder /app/apps/marketing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/marketing/.next/static \
                                          ./apps/marketing/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/marketing/public \
                                          ./apps/marketing/public

USER nextjs

EXPOSE 3000

# server.js is emitted by Next.js standalone into the monorepo path
CMD ["node", "apps/marketing/server.js"]
