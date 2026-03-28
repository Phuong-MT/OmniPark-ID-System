FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the NestJS application
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Keep the container running non-root (optional but recommended for security)
USER node

# Expose port (default NestJS port is 3000, but often configurable)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
