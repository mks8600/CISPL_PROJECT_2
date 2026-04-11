FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
