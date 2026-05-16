FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy workspace manifests and source
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
RUN pnpm install --frozen-lockfile

# Build frontend and backend
RUN pnpm --filter @workspace/team-task-manager run build
RUN pnpm --filter @workspace/api-server run build

FROM node:20-slim AS runner
WORKDIR /usr/src/app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY artifacts ./artifacts
COPY lib ./lib

RUN corepack enable && corepack prepare pnpm@11.1.2 --activate
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /usr/src/app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /usr/src/app/artifacts/team-task-manager/dist ./artifacts/team-task-manager/dist

EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]
