# Multi-stage production build for Abhisaran Web Frontend
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Runtime
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx HTML files
RUN rm -rf ./*

# Copy compiled assets from builder
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /docker-entrypoint-app.sh
RUN chmod +x /docker-entrypoint-app.sh

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

ENTRYPOINT ["/docker-entrypoint-app.sh"]
