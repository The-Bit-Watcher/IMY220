FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Start Vite with --host flag so it accepts requests outside the container
CMD ["npm", "run", "dev", "--", "--host"]