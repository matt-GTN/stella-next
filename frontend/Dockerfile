# Utiliser l'image officielle Node.js comme image de base
FROM node:18-alpine AS base

# Installer les dépendances seulement quand nécessaire
FROM base AS deps
# Voir https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine pour comprendre pourquoi libc6-compat pourrait être nécessaire.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Installer les dépendances basées sur le gestionnaire de paquets préféré
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Reconstruire le code source seulement quand nécessaire
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Définir les variables d'environnement pour le build de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Construire l'application avec sortie standalone
RUN npm run build

# Image de production, copier tous les fichiers et exécuter next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Définir les permissions correctes pour le cache de pré-rendu
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Utiliser automatiquement les traces de sortie pour réduire la taille de l'image
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js est créé par next build à partir de la sortie standalone
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]