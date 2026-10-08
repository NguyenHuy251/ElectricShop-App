FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && mkdir -p uploads logs && chown -R node:node /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node database ./database
USER node
EXPOSE 3000
CMD ["sh", "-c", "node scripts/repair-procedures.mjs --apply && node scripts/migrate-deploy.mjs && node dist/app.js"]
