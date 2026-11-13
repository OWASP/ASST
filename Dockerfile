# OWASP ASST container image.
#
# Scans the project mounted at /src and writes the reports to /out:
#   docker build -t asst .
#   docker run --rm -v "$PWD:/src:ro" -v "$PWD/asst-out:/out" asst
#   docker run --rm -v "$PWD:/src:ro" -v "$PWD/asst-out:/out" asst --lang nodejs --format html,sarif --fail-on high
#
# Database and PHP runtime checks are off by default in the container (no MySQL or PHP
# inside it); live checks work with --url when the site is reachable from the container.
#
# Base image pinned by digest; refresh it with: docker pull node:22-alpine && docker inspect node:22-alpine
FROM node:22.23.5-alpine3.24@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a

ENV NODE_ENV=production \
    ASST_PATH=/src \
    ASST_OUT=/out \
    ASST_NO_DB=1 \
    ASST_PHP_BIN=""

WORKDIR /opt/asst
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY main.js config.js config_php_lang.js LICENSE.md ./
COPY core ./core
COPY langs ./langs
COPY data ./data

RUN mkdir -p /src /out && chown node:node /out
USER node
WORKDIR /src

ENTRYPOINT ["node", "/opt/asst/main.js"]
