# Use the smallest Node.js image
FROM node:alpine AS builder

# Install necessary build tools (g++, make) for compiling C++
RUN apk add --no-cache g++ make python3

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install dependencies, including amqplib
RUN npm install --only=production

# Copy worker script
COPY worker.js .

# Set execution permissions for compiled binaries
RUN chmod +x /app

# Set the entry point to run worker.js
CMD ["node", "worker.js"]
