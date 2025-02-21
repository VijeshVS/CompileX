# Use the smallest Node.js image
FROM node:alpine AS builder

# Install GCC and required build tools
RUN apk add --no-cache gcc g++ make python3

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install dependencies, including amqplib
RUN npm install

# Copy worker.js into the container
COPY worker.js .

# Set the entry point to run worker.js
CMD ["node", "worker.js"]
