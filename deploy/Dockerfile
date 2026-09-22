FROM node:24-alpine AS app
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN node serve.cjs --write-index && node deploy/build-public.cjs /public
ENV DUO_HOST=0.0.0.0 DUO_PORT=8090 DUO_SAVE_FILE=/data/checkpoint.json
EXPOSE 8090
CMD ["node", "server/start-duo.cjs"]
FROM caddy:2-alpine AS web
COPY --from=app /public /srv/site
COPY deploy/Caddyfile /etc/caddy/Caddyfile
