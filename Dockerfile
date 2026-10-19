# syntax=docker/dockerfile:1
FROM node:22.23.3-bookworm-slim AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS build
COPY . .
# Generation/build never connect to this placeholder.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:1/build
RUN npm run prisma:generate
# Public NEXT_PUBLIC_* settings only. Never put runtime secrets in this build input.
RUN --mount=type=secret,id=public_env,target=/app/.env.production,required=false npm run build

FROM build AS migrate
USER node
CMD ["npm", "run", "db:deploy"]

FROM node:22.23.3-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=8s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
