FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 10000

CMD ["sh", "-c", "npx prisma db push && npm run prisma:seed && npm run start:prod"]