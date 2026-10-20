# syntax=docker/dockerfile:1
#
# Image de production de Black House (Next.js, build « standalone »).
# Utilisée par Coolify sur le VPS : voir docs/deploiement.md.
#
# Les variables NEXT_PUBLIC_* sont inscrites dans le code AU MOMENT DU BUILD : il faut les
# fournir comme « build args » (dans Coolify : cocher « Available at Buildtime »).
# Le build lit aussi le catalogue pour pré-rendre les pages : la base doit donc être joignable
# depuis la machine qui construit l'image.

# --- 1. Dépendances ------------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- 2. Build ------------------------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SHOP_WHATSAPP
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SHOP_WHATSAPP=$NEXT_PUBLIC_SHOP_WHATSAPP \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- 3. Exécution --------------------------------------------------------------------------
FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Le build « standalone » ne contient que les fichiers nécessaires (pas de node_modules complet).
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# SUPABASE_SECRET_KEY est lue À L'EXÉCUTION (jamais au build) : à définir dans Coolify, en variable
# d'exécution seulement.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
