# Docker Hosting Guide

This guide shows how to run Scopa Companion in a Docker container for production-style static hosting.

The app is a Vite + React frontend, so the recommended pattern is:

1. Build static files with Node.
2. Serve `dist/` with Nginx.

## Prerequisites

- Docker installed
- Docker Compose plugin installed (optional, for compose workflow)

## Important Note About Environment Variables

This app reads Supabase values from Vite variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Because Vite injects these at build time, they must be present when building the image.

If you do not provide them, cloud sync is disabled and the app still works with local-only storage.

## 1. Create a Dockerfile

Create `Dockerfile` in the project root:

```dockerfile
# Stage 1: build the app
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Optional build args for Vite env vars
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Stage 2: serve static files with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 2. Create a .dockerignore File

Create `.dockerignore` in the project root:

```dockerignore
node_modules
dist
.git
.gitignore
.vscode
npm-debug.log*
.DS_Store
*.local
.env
.env.*
```

## 3. Build the Image

### Without cloud sync vars

```bash
docker build -t scopa-companion:latest .
```

### With cloud sync vars

```bash
docker build \
  --build-arg VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY" \
  -t scopa-companion:latest .
```

## 4. Run the Container

```bash
docker run -d --name scopa-companion -p 8080:80 scopa-companion:latest
```

Open the app at:

- http://localhost:8080

## 5. Optional: Docker Compose

Create `docker-compose.yml` in the project root:

```yaml
services:
  scopa-companion:
    build:
      context: .
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-}
        VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:-}
    image: scopa-companion:latest
    container_name: scopa-companion
    ports:
      - "8080:80"
    restart: unless-stopped
```

Then run:

```bash
docker compose up -d --build
```

If using cloud sync, place variables in a local `.env` file before running compose:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 6. Common Operations

Stop/remove container:

```bash
docker rm -f scopa-companion
```

Rebuild and rerun (docker run workflow):

```bash
docker build -t scopa-companion:latest .
docker rm -f scopa-companion
docker run -d --name scopa-companion -p 8080:80 scopa-companion:latest
```

View logs:

```bash
docker logs -f scopa-companion
```

## 7. Deployment Notes

- This container serves static assets only.
- If you deploy behind a reverse proxy, map external HTTPS traffic to container port 80.
- For production, pin image versions and use a CI pipeline to build/publish images.
