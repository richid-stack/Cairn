# Build from the repository root:
#   docker build -f apps/api/Dockerfile -t cairn-api .
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS deps
# Only the manifests first, so dependency layers are cached until they change.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/contract/package.json packages/contract/
RUN pnpm install --frozen-lockfile --prod --filter @cairn/api...

FROM base AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages/contract/node_modules ./packages/contract/node_modules
COPY package.json pnpm-workspace.yaml ./
COPY apps/api ./apps/api
COPY packages/contract ./packages/contract
USER node
WORKDIR /repo/apps/api
EXPOSE 8080
CMD ["node_modules/.bin/tsx", "src/server.ts"]
