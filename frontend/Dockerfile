# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Build-time env vars are baked into the Vite bundle.
# VITE_API_BASE_URL should be the backend's public URL (no trailing slash),
# e.g. "https://api.example.com". When unset (local compose), the frontend
# falls back to relative "/api" which nginx proxies to the "backend" service.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
