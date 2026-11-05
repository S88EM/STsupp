# Multi-stage Dockerfile for STsup (Home Assistant Add-on & Standalone Docker)
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl postgresql postgresql-contrib su-exec bash

FROM base AS dependencies
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Directories for PostgreSQL and file storage
RUN mkdir -p /data/postgres /data/uploads /run/postgresql /app/public && \
    chown -R postgres:postgres /run/postgresql

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

EXPOSE 3000

CMD ["/app/run.sh"]
