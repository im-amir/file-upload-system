FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache yarn

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Use next dev for hot reloading
CMD ["npm", "run", "dev"]
