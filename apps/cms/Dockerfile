FROM pluto:nx-base AS builder
# The whole monorepo source is already copied under /app
WORKDIR /app

# produce a production build and output it to /app/dist/apps/cms
RUN nx run cms:build

# Run the built app in a clean slim image
FROM node:18-alpine AS production
# Upgrade npm
RUN npm install -g npm@latest

ENV NODE_ENV=production

WORKDIR /app

# Copy the built app from the builder image
COPY --from=builder /app/dist/apps/cms .
# Install only production dependencies
RUN rm -rf node_modules && npm install --omit=dev

# Install PM2 globally
RUN npm install -g pm2@latest
COPY --from=builder /app/apps/cms/ecosystem.config.js .

CMD ["pm2", "start", "ecosystem.config.js", "--no-daemon"]