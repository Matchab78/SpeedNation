# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with --ignore-scripts to avoid recursive loops
# and --no-audit for speed
COPY package*.json ./
RUN npm install --ignore-scripts --no-audit

COPY . .

# Run the build (npx expo export)
RUN npm run build

# Copy PWA assets into dist so they are served correctly
RUN mkdir -p /app/dist/assets && \
    cp /app/assets/favicon.ico /app/dist/favicon.ico && \
    cp /app/assets/favicon-96x96.png /app/dist/favicon-96x96.png && \
    cp /app/assets/favicon.svg /app/dist/favicon.svg && \
    cp /app/assets/apple-touch-icon.png /app/dist/apple-touch-icon.png && \
    cp /app/assets/site.webmanifest /app/dist/site.webmanifest && \
    cp /app/assets/logo.png /app/dist/assets/logo.png && \
    cp /app/manifest.json /app/dist/manifest.json


# Production stage - serve static files with simple HTTP server
FROM node:20-alpine

WORKDIR /app

# The build output for web in Expo 50+ is in 'dist'
COPY --from=builder /app/dist ./dist

# Install a simple HTTP server
RUN npm install -g http-server

EXPOSE 80

CMD ["http-server", "dist", "-p", "80", "-a", "0.0.0.0", "--cors"]

