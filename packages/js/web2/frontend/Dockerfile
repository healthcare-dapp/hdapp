FROM hdapp:latest AS builder
RUN yarn nx build js-web2-frontend --config=production --generatePackageJson

FROM nginx:latest as result
COPY --from=builder /app/dist/packages/js/web2/frontend /usr/share/nginx/html