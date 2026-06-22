# Production backend image for FleetCommand API
# Works on any container host (Render, Railway, Fly.io, a VPS, etc.)
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# The app reads PORT from the environment (defaults to 4000)
EXPOSE 4000

CMD ["node", "src/index.js"]
