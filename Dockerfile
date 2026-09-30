FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

RUN npm ci

COPY . .

RUN npm run prisma:generate -w apps/api
RUN npm run build -w apps/api

EXPOSE 3001

CMD ["npm", "start", "-w", "apps/api"]
