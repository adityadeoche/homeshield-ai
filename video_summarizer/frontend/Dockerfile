# Stage 1: Build React + Vite app
FROM node:20-alpine AS builder

WORKDIR /app
COPY video_summarizer/frontend/package*.json ./
RUN npm install

COPY video_summarizer/frontend/ .
RUN npm run build

# Stage 2: Serve with Nginx (~30MB final image)
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx: SPA fallback + reverse proxy to backend
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api {\n\
        proxy_pass http://backend-service:8001;\n\
        proxy_set_header Host $host;\n\
        proxy_read_timeout 300s;\n\
    }\n\
    location /outputs {\n\
        proxy_pass http://backend-service:8001;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
