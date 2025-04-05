# -------------->
FROM node:16.13-alpine AS installer

USER node

WORKDIR /home/node

COPY --chown=node:node package*.json ./

RUN npm ci

# -------------->
FROM node:16.13-alpine AS builder

USER node

WORKDIR /home/node

COPY --chown=node:node --from=installer /home/node/node_modules ./node_modules
COPY --chown=node:node . .

RUN npm run build

# -------------->
FROM node:16.13-alpine AS runner

RUN apk add dumb-init

ENV NODE_ENV 'production'

USER node

WORKDIR /home/node

COPY --chown=node:node --from=installer /home/node/node_modules ./node_modules
COPY --chown=node:node --from=builder /home/node/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node wait-for.sh ./

CMD ["dumb-init", "node", "dist/main.js"]
