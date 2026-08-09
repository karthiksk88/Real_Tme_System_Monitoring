# Robust Dockerfile supporting both Root and Subfolder Railway Build Contexts

FROM node:18-alpine
WORKDIR /app

# Copy package.json whether build context is root or neurosys-frontend subfolder
COPY package*.json neurosys-frontend/package*.json ./
RUN npm install

# Copy source files
COPY . .

# If built from repository root, move neurosys-frontend files to working directory
RUN if [ -d "neurosys-frontend" ]; then cp -r neurosys-frontend/* . ; fi

ARG VITE_API_BASE_URL=https://realtmesystemmonitoring-production.up.railway.app/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
