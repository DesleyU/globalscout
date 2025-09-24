# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory to backend
WORKDIR /app

# Copy ALL backend files first (including prisma directory)
COPY backend/ ./

# Install dependencies
RUN npm ci

# Generate Prisma client (now prisma directory is in correct location)
RUN npx prisma generate

# Run database migrations
RUN npx prisma migrate deploy || echo "Migration failed, continuing..."

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["npm", "start"]
