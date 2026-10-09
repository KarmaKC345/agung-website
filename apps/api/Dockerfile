# syntax=docker/dockerfile:1
# Dibangun dari root repo: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter "@newagung/api..."
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @newagung/api build \
 && pnpm --filter @newagung/api deploy --prod --legacy /out

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=4000 SUPABASE_DIR=/app/supabase
WORKDIR /app
COPY --from=build /out/package.json ./
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
# migrasi & data awal, dijalankan otomatis oleh API saat menyala
COPY supabase/migrations ./supabase/migrations
COPY supabase/seed.sql ./supabase/seed.sql
# folder foto (dipasang sebagai volume oleh docker compose)
RUN mkdir -p uploads && chown node:node uploads
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
CMD ["node", "dist/index.mjs"]
