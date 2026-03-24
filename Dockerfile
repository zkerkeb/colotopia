FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG PUBLIC_GA_MEASUREMENT_ID=G-3LMQNYBWM9
ARG PUBLIC_ADSENSE_PUBLISHER_ID
ENV PUBLIC_GA_MEASUREMENT_ID=$PUBLIC_GA_MEASUREMENT_ID
ENV PUBLIC_ADSENSE_PUBLISHER_ID=$PUBLIC_ADSENSE_PUBLISHER_ID
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
