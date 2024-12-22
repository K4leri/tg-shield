FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install system dependencies in a single layer
FROM base AS deps
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy only package files first to leverage build cache
FROM deps AS install
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
FROM install AS build
COPY . .

# Final stage
FROM base AS release
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/src ./src
COPY --from=build /usr/src/app/package.json ./

USER bun
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
