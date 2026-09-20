# Multi-stage production build for Amvera / Docker
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for fast caching
COPY package*.json ./
RUN npm install

# Copy source code and build Vite app + bundled Express server
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
