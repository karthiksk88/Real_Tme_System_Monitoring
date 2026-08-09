# Clean Dockerfile for React Frontend SPA on Railway

FROM node:18-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files and build bundle
COPY . .
ARG VITE_API_BASE_URL=https://realtmesystemmonitoring-production.up.railway.app/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Expose target port
EXPOSE 3000

# Serve SPA static build on port 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
