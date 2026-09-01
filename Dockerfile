# Hugging Face Spaces (and any other Docker host). Boots the P0 against real
# credentials supplied at runtime. Fake IRNs and demo doors are refused.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1000 user \
  && useradd --uid 1000 --gid 1000 --create-home user

WORKDIR /app
COPY apps/stampa/package.json apps/stampa/package-lock.json ./
RUN npm ci

COPY apps/stampa ./
RUN npm run build \
  && chmod +x scripts/demo-start.sh \
  && mkdir -p /tmp/stampa \
  && chown -R user:user /app /tmp/stampa

USER user
ENV HOME=/home/user
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["scripts/demo-start.sh"]
