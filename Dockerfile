# Hugging Face Spaces (and any other Docker host). Builds the P0 and boots it
# as a public demo: fake gateway, seeded data, one-click sessions. Nothing is
# sent to the NRS.
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
  && mkdir -p /tmp/stampa-demo \
  && chown -R user:user /app /tmp/stampa-demo

USER user
ENV HOME=/home/user
ENV NODE_ENV=production
ENV STAMPA_DEMO=true
ENV STAMPA_GATEWAY=fake
ENV PORT=7860
EXPOSE 7860

CMD ["scripts/demo-start.sh"]
