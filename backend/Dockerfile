FROM node:20-alpine

WORKDIR /app

# System deps: build tools (native modules), chromium (WhatsApp/Puppeteer)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    musl-dev \
    libtool \
    autoconf \
    automake \
    pixman-dev \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    giflib-dev \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dbus \
    udev \
    libx11 \
    libxcb \
    libxcomposite \
    libxdamage \
    libxext \
    libxfixes \
    libxrandr \
    libxtst \
    mesa-gl \
    alsa-lib \
    2>/dev/null || true

# Ensure chromium binary is available at the expected path
RUN ln -sf /usr/lib/chromium/chromium /usr/bin/chromium-browser 2>/dev/null || true

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install dependencies (includes devDependencies needed for build)
COPY package*.json ./
RUN npm ci

# Generate Prisma client (dummy DATABASE_URL only needed for generate step)
COPY prisma ./prisma
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/setdit?schema=public"
RUN npx prisma generate

# Copy source and build TypeScript
COPY . .
RUN npm run build

EXPOSE 5100

ENV NODE_ENV=production
ENV PORT=5100

CMD ["node", "dist/index.js"]
