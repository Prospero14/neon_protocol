# Stage 1: Build
FROM node:22-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Frontend (outputs to dist) and Backend (outputs to dist_server)
RUN npm run build

# Stage 2: Final Run
FROM node:22-alpine

WORKDIR /app

# Copy only production dependencies (optional, but keep it simple for now)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist_server ./dist_server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dev.db ./dev.db

# Ensure startup scripts work
RUN mkdir -p dist_server

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Start command
CMD ["node", "dist_server/index.js"]
