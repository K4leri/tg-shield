FROM oven/bun AS build
WORKDIR /app 

# install dependencies 
RUN apt update && apt install -y python3 make gcc g++

# Cache packages installation
COPY package.json bun.lockb ./
RUN bun install

COPY ./src ./src
COPY ./config.json config.json
COPY ./bot-data /app/bot-data
COPY ./src/utils/captcha/fonts/Comismsh.ttf /app/fonts/Comismsh.ttf

ENV NODE_ENV=production

RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    ./src/index.ts

# Set permissions for the server file
RUN chmod 755 server

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

USER 1001

ENV NODE_ENV=production

CMD ["./server"]
