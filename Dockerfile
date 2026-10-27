FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG PUBLIC_GA_MEASUREMENT_ID=G-3LMQNYBWM9
ARG PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-1257217558521249
ARG DATABASE_URL
ENV PUBLIC_GA_MEASUREMENT_ID=$PUBLIC_GA_MEASUREMENT_ID
ENV PUBLIC_ADSENSE_PUBLISHER_ID=$PUBLIC_ADSENSE_PUBLISHER_ID
ENV DATABASE_URL=$DATABASE_URL
# Keep only fingerprinted image artifacts between builds. Tests and catalog
# publication still run against the current commit and database on every deploy.
RUN --mount=type=cache,id=colotopia-astro-assets-v1,target=/app/node_modules/.astro/assets,sharing=locked npm run verify

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/dist/_redirects.nginx /etc/nginx/colotopia-redirects.map
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN nginx -t
EXPOSE 80
