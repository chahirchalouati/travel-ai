# Stage 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/travel-ai/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

EXPOSE 80

# envsubst sostituisce $BACKEND_URL nel config prima di avviare nginx
CMD ["/bin/sh", "-c", "envsubst '$BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
