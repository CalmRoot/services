FROM node:20-alpine AS builder
RUN addgroup -S calmroot && adduser -S calmroot -G calmroot
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:20-alpine AS production
RUN addgroup -S calmroot && adduser -S calmroot -G calmroot
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/src ./src
USER calmroot
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=10s \
  --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:3003/health || exit 1
CMD ["node", "src/index.js"]
