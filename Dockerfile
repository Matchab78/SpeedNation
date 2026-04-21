# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with --ignore-scripts to avoid recursive loops
# and --no-audit for speed
COPY package*.json ./
RUN npm install --ignore-scripts --no-audit

COPY . .

# Run the build (npx expo export)
# We don't ignore scripts here if any build script is needed, 
# but we've cleaned up package.json
RUN npm run build

# Production stage - serve static files with simple HTTP server
FROM node:20-alpine

WORKDIR /app

# The build output for web in Expo 50+ is in 'dist'
COPY --from=builder /app/dist ./dist

# Install a simple HTTP server
RUN npm install -g http-server

EXPOSE 80

CMD ["http-server", "dist", "-p", "80", "-a", "0.0.0.0"]
