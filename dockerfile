FROM oven/bun:latest AS build
WORKDIR /app 

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    gcc \
    g++ \
    fontconfig

# Cache dependencies
COPY package.json bun.lockb ./
RUN bun install --production

# Copy source files
COPY ./src ./src
COPY ./config.json ./
COPY ./bot-data ./bot-data
COPY ./src/utils/captcha/fonts/Comismsh.ttf ./fonts/Comismsh.ttf

# Compile TypeScript
RUN bun build ./src/index.ts --compile --target bun

FROM debian:bullseye-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy compiled binary and necessary files
COPY --from=build /app/index /app/index
COPY --from=build /app/config.json /app/config.json
COPY --from=build /app/bot-data /app/bot-data
COPY --from=build /app/fonts /app/fonts

# Set non-root user
USER 1001

ENV NODE_ENV=production

# Run the compiled binary
CMD ["/app/index"]
