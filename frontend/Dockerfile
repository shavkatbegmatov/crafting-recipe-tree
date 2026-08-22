# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Build-time env vars are baked into the Vite bundle.
# VITE_API_BASE_URL should be the backend's public URL (no trailing slash),
# e.g. "https://api.example.com". When unset (local compose), the frontend
# falls back to relative "/api" which nginx proxies to BACKEND_ORIGIN.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx konfiguratsiyasi shablondan konteyner ishga tushganda yasaladi, chunki
# backend manzili muhitga qarab farq qiladi (compose'da servis nomi, boshqa joyda
# ochiq URL). Sukut qiymati loyihaga xos nom — umumiy `backend` nomi umumiy
# tarmoqda begona loyihaga hal bo'lib ketishi mumkin.
ENV BACKEND_ORIGIN=http://crafttree-backend:8080
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.d/20-backend-origin.sh /docker-entrypoint.d/20-backend-origin.sh

# Shablonni qurilish vaqtida bir marta yasab, nginx bilan tekshiramiz: sintaksis
# xatosi deploy paytida emas, aynan shu yerda bilinsin. Konteyner ishga tushganda
# entrypoint uni haqiqiy BACKEND_ORIGIN bilan qayta yasaydi.
RUN chmod +x /docker-entrypoint.d/20-backend-origin.sh && \
    /docker-entrypoint.d/20-backend-origin.sh && \
    nginx -t

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
