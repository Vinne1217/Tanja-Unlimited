# Install dependencies
FROM node:18 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Build Next.js application
RUN npm run build

# Production image
FROM node:18 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy over build output
COPY --from=builder /app ./

# Expose port
EXPOSE 8080

# Cloud Run expects the service to listen on $PORT
ENV PORT=8080

CMD ["npm", "start"]
