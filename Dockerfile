# Multi-stage build for Daycare Management System

# Stage 1: Build the client
FROM node:20-alpine AS client-build
WORKDIR /app
COPY client/package*.json ./client/
COPY shared/ ./shared/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Build the server
FROM node:20-alpine AS server-build
WORKDIR /app
COPY server/package*.json ./server/
COPY shared/ ./shared/
RUN cd server && npm ci
COPY server/ ./server/

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install production server dependencies only
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy shared constants
COPY shared/ ./shared/

# Copy server source (will be run with tsx)
COPY server/ ./server/

# Copy built client
COPY --from=client-build /app/client/dist ./client/dist

# Create data directory
RUN mkdir -p /app/data /app/data/backups

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data
ENV SESSION_SECRET=change-this-in-production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3001/api/health || exit 1

# Start server
CMD ["npx", "tsx", "server/src/index.ts"]
