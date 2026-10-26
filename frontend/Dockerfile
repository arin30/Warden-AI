# ──────────────────────────────────────────────
# Stage 1 – Build the Vite bundle
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (leverage Docker layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY tailwind.config.js postcss.config.js ./
COPY index.html ./
COPY src/ ./src/
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2 – Serve with Nginx
# ──────────────────────────────────────────────
FROM nginx:stable-alpine AS production

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
