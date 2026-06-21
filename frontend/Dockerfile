FROM node:20-alpine AS builder
RUN apk update && apk upgrade --no-cache
WORKDIR /app

ARG VITE_AUTH_URL=""
ARG VITE_ASSESSMENT_URL=""
ARG VITE_THERAPIST_URL=""
ARG VITE_CHATBOT_ENABLED=true

ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_ASSESSMENT_URL=$VITE_ASSESSMENT_URL
ENV VITE_THERAPIST_URL=$VITE_THERAPIST_URL
ENV VITE_CHATBOT_ENABLED=$VITE_CHATBOT_ENABLED

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS production
USER root
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown -R 101:101 /usr/share/nginx/html /etc/nginx/conf.d
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s \
  --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:8080/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
