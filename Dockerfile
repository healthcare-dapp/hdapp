FROM node:18-alpine
RUN apk add git
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .