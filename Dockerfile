FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts

EXPOSE 4000

USER node

CMD ["npm", "start"]
