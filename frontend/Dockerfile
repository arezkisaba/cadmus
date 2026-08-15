FROM node:20-slim AS builder
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm ci
COPY ./frontend/tsconfig.json ./frontend/
COPY ./shared/tsconfig.json ./shared/
COPY ./frontend ./frontend
COPY ./shared ./shared
WORKDIR /app/frontend
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm ci --production
COPY --from=builder /app/frontend/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/frontend/scripts ./scripts
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

EXPOSE 4445
CMD ["node", "scripts/serve-https.mjs"]