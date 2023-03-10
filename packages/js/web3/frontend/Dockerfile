FROM ethereum/solc:0.8.17-alpine AS solc
FROM hdapp:latest AS builder

# goddammit
RUN mkdir -p /root/.cache/hardhat-nodejs/compilers-v2/linux-amd64
COPY list.json /root/.cache/hardhat-nodejs/compilers-v2/linux-amd64
COPY --from=solc /usr/local/bin/solc /root/.cache/hardhat-nodejs/compilers-v2/linux-amd64
RUN mv /root/.cache/hardhat-nodejs/compilers-v2/linux-amd64/solc /root/.cache/hardhat-nodejs/compilers-v2/linux-amd64/solc-linux-amd64-v0.8.17+commit.8df45f5f

RUN yarn nx build js-web3-frontend --config=production --generatePackageJson

FROM nginx:latest as result
COPY --from=builder /app/dist/packages/js/web3/frontend /usr/share/nginx/html/app