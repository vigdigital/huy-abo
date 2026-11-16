FROM node:24-alpine
WORKDIR /app

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force
COPY server/*.js ./server/

# Chỉ chép các file của trang web (không lộ code server ra ngoài)
COPY index.html app.js account.js data.js links.js styles.css ./public/
COPY assets/ ./public/assets/

RUN mkdir -p /data && chown node:node /data
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data PUBLIC_DIR=/app/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/server.js"]
