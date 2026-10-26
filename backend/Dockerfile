# ──────────────────────────────────────────────
# Stage 1 – Build
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

# Native dependencies required by better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies (leverage Docker layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2 – Production
# ──────────────────────────────────────────────
FROM node:20-alpine AS production

# Native runtime dependency for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && apk del python3 make g++

# Copy compiled output from build stage
COPY --from=build /app/dist ./dist

# Create a directory for the SQLite database
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
