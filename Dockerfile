FROM node:18-alpine AS dependency-installer
RUN apk add git
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn

FROM ethereum/solc:0.8.17-alpine AS solc
FROM dependency-installer AS copier

# goddammit
COPY ./misc/solidity-compilers-list.json /root/.cache/hardhat-nodejs/compilers-v2/linux-amd64/list.json
COPY --from=solc /usr/local/bin/solc /root/.cache/hardhat-nodejs/compilers-v2/linux-amd64/solc-linux-amd64-v0.8.17+commit.8df45f5f

COPY . .