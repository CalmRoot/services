FROM node:20-alpine AS builder
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

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
HEALTHCHECK --interval=30s --timeout=10s \
  --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
