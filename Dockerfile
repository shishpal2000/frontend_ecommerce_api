# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install || npm install --force || npm install --legacy-peer-deps || true

# Copy all source code
COPY . .

RUN npm run build

# Expose port 3000
EXPOSE 3000

# Run in development mode (no build required)
CMD ["npm", "start"]