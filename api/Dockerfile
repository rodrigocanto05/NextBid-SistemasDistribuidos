FROM node:22-alpine

RUN apk add --no-cache su-exec

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY scripts ./scripts
COPY docker-entrypoint.sh /usr/local/bin/api-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/api-entrypoint.sh && chmod +x /usr/local/bin/api-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

# Arranca como root só para acertar as permissões do volume; a API corre como "node"
ENTRYPOINT ["api-entrypoint.sh"]
CMD ["node", "src/server.js"]
