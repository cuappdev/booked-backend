# Build stage: compile the TypeScript
FROM node:24-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ormconfig.ts ./
COPY src ./src/
RUN npm run build

# Runtime stage: production dependencies and compiled output only
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4000
# Migrations run automatically when the server starts.
CMD ["node", "dist/src/app.js"]
