FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only production)
RUN npm install --only=production

# Copy application source
COPY . .

# Expose API port
EXPOSE 4000

# Start server
CMD ["npm", "start"]
