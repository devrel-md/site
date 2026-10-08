# Production image for devrel.md, built for OpenShip on the Hetzner box.
# Multi-stage build using Next.js standalone output.

FROM node:22-alpine AS base

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Content is plain files in content/ (synced copies of devrel-md/spec and
# devrel-md/skills), so a plain clone is a complete build context.
ARG GIT_COMMIT_SHA=unknown
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/db/migrations ./db/migrations
# content/spec and content/skills are read from disk at request time (see
# lib/content.ts), not imported as JS modules, so Next's output file tracing
# does not pick them up into .next/standalone on its own.
COPY --from=builder /app/content ./content

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
