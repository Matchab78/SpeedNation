# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage - serve static files with simple HTTP server
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

# Install a simple HTTP server
RUN npm install -g http-server

EXPOSE 80

CMD ["http-server", "dist", "-p", "80", "-a", "0.0.0.0"]
