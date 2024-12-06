FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache yarn

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
