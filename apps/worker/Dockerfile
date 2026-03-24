FROM node:24-alpine
WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY . .
RUN npm run build --workspace @lover-memory/worker

WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
