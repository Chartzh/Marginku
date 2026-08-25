# Stage 1: Build static assets
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock* package-lock.json* ./
RUN bun install || npm install

COPY . .
RUN bun run build || npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
