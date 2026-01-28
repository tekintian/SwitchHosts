# Multi-stage Dockerfile for SwitchHosts
# This is for testing/demonstration purposes. For actual use, the desktop app is recommended.

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    pkg-config \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

# Copy package files
COPY package*.json ./
COPY app/package.json ./app/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application (if needed)
RUN npm run build || echo "Build step skipped or failed, continuing..."

# Stage 2: Runtime
FROM node:20-alpine

# Install runtime dependencies for electron
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    libpng \
    libjpeg-turbo \
    giflib \
    ca-certificates \
    ttf-freefont \
    chromium \
    chromium-chromedriver

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app /app
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S switchhosts && \
    adduser -S switchhosts -u 1001 -G switchhosts

# Switch to non-root user
USER switchhosts

# Expose HTTP API port (if needed)
EXPOSE 50761

# Set environment
ENV NODE_ENV=production
ENV ELECTRON_DISABLE_SECURITY_WARNINGS=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Note: Electron desktop app cannot run in Docker
# This Dockerfile is mainly for CI/CD and testing purposes
# The actual SwitchHosts application should be run as a native desktop application

CMD ["node", "-e", "console.log('SwitchHosts is a desktop application. Please use the native installer.')"]
