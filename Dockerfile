FROM node:22.22.1-bookworm-slim AS build
WORKDIR /app
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm ci --prefix client --ignore-scripts && npm ci --prefix server --ignore-scripts
COPY client client
COPY server server
COPY shared shared
COPY package.json ./
RUN npm run check

FROM node:22.22.1-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=5001 DATABASE_PATH=/app/server/data/telemetry.sqlite
COPY --from=build /app/server /app/server
COPY --from=build /app/shared /app/shared
COPY --from=build /app/client/dist /app/client/dist
RUN mkdir -p /app/server/data && chown -R node:node /app/server/data
USER node
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/server.js"]
