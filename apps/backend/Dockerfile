FROM node:20-slim AS builder

# pnpmインストール
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 依存関係のインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ソースのコピーとビルド
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ============================================================
# 本番ステージ
# ============================================================
FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 本番依存のみインストール
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ビルド成果物のコピー
COPY --from=builder /app/dist ./dist

# ポート公開
EXPOSE 8080

# 起動
CMD ["node", "dist/index.js"]
