FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy backend source code
COPY . .

# Expose Express server port
EXPOSE 5000

# Start Express backend
CMD ["node", "src/server.js"]