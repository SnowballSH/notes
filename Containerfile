FROM docker.io/library/node:26.11.1-trixie@sha256:32fa97f3363975684b08bf4e8a68a47c7905175cc20275b50b974bbd02aba731 AS site
WORKDIR /src
RUN chown node:node /src
USER node
COPY --chown=node:node package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund
COPY --chown=node:node . .
RUN npm run check
RUN npm run lint
RUN npm run build

FROM docker.io/library/caddy:2.11.7@sha256:36c24ad91a7ff7bc4c87fe22bfa8df3c4b18da0773d73fc12ee2c52b98c0bb7e
ARG SOURCE_COMMIT=unknown
LABEL org.opencontainers.image.source="https://github.com/SnowballSH/notes" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}" \
      org.opencontainers.image.version="${SOURCE_COMMIT}" \
      org.opencontainers.image.title="notes" \
      org.opencontainers.image.description="Academic lecture notes" \
      org.opencontainers.image.url="https://notes.snowballsh.com" \
      org.opencontainers.image.vendor="SnowballSH"
RUN apk add --no-cache libcap \
 && setcap -r /usr/bin/caddy \
 && apk del libcap \
 && addgroup -S -g 10001 notes \
 && adduser -S -D -H -u 10001 -G notes -h /nonexistent -s /sbin/nologin notes
COPY Caddyfile.container /etc/caddy/Caddyfile
COPY --from=site /src/build /srv
USER 10001:10001
EXPOSE 8080
