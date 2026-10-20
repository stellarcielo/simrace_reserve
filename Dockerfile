# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# ---- ビルド ----
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app

# better-sqlite3 のビルド済みバイナリが無い環境向けのフォールバック
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# postinstall の prisma generate に schema / config が必要
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
ENV DATABASE_URL="file:/tmp/build.db"
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build \
  && npm prune --omit=dev

# ---- 実行 ----
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  DATABASE_URL="file:/app/data/app.db"

COPY --from=builder --chown=node:node /app/package.json /app/next.config.ts /app/prisma.config.ts ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next

# SQLite の DB ファイル置き場（ボリュームをマウントして永続化する）
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME ["/app/data"]

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/simrace-entrypoint.sh

EXPOSE 4000

# root で起動して /app/data の所有者を直したあと、node ユーザーでマイグレーション → サーバー起動
CMD ["/usr/local/bin/simrace-entrypoint.sh"]
