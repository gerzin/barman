# --- Dependencies -----------------------------------------------------------
# Installed in their own stage so they're only rebuilt when the lockfile
# changes, and so dev-only tooling never leaks into later stages.
FROM node:22-alpine AS deps
WORKDIR /app

COPY barman/package.json barman/package-lock.json ./
RUN npm ci

# --- Build --------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY barman/ .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runtime --------------------------------------------------------------
# Only the standalone server output + static assets are copied in, so the
# final image doesn't carry node_modules, source files, or build caches.
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
