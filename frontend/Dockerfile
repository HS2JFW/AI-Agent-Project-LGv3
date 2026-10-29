FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# In production behind Nginx reverse proxy, VITE_BACKEND_URL defaults to empty (relative path /api)
ARG VITE_BACKEND_URL=""
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx configuration optimized for Coolify production:
# - React SPA router fallback
# - Real-time SSE streaming (proxy_buffering off, no timeout)
# - Large file upload support (client_max_body_size 100M)
# - Unified routing for /api/, /docs, /openapi.json, and /health
RUN echo 'server { \
    listen 80; \
    client_max_body_size 100M; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api/ { \
        proxy_pass http://backend:8001/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
        proxy_buffering off; \
        proxy_cache off; \
        chunked_transfer_encoding off; \
        proxy_read_timeout 86400s; \
    } \
    \
    location /docs { \
        proxy_pass http://backend:8001/docs; \
        proxy_set_header Host $host; \
    } \
    \
    location /openapi.json { \
        proxy_pass http://backend:8001/openapi.json; \
        proxy_set_header Host $host; \
    } \
    \
    location /redoc { \
        proxy_pass http://backend:8001/redoc; \
        proxy_set_header Host $host; \
    } \
    \
    location /health { \
        proxy_pass http://backend:8001/health; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
