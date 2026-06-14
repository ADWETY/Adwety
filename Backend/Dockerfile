FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .
RUN mkdir -p /app/private_uploads && chown -R node:node /app/private_uploads

ENV NODE_ENV=production
USER node
EXPOSE 6500
CMD ["node", "index.js"]
