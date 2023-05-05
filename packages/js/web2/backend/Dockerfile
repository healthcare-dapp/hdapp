FROM hdapp:latest AS base
RUN yarn nx build js-web2-backend --config=production --generatePackageJson

FROM node:18-alpine AS runner
WORKDIR /app
COPY ./mailStuff /app
COPY --from=base /app/dist/packages/js/web2/backend/package.json /app/dist/packages/js/web2/backend/yarn.lock ./
RUN yarn --production
COPY --from=base /app/dist/packages/js/web2/backend ./
USER node
EXPOSE 8080
CMD node /app