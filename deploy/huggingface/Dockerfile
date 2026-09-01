# Hugging Face Space image: clone the public GitHub repo and boot the app.
# Secrets (gateway, Termii, mailer) must be set on the Space. Fake IRNs are refused.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 1000 user \
  && useradd --uid 1000 --gid 1000 --create-home user

ARG REPO=https://github.com/moyesrex-ops/New-agent-work.git
ARG REF=cursor/asia-pacific-demand-notes-b31b

WORKDIR /src
RUN git clone --depth 1 --branch "${REF}" "${REPO}" .

WORKDIR /src/apps/stampa
RUN npm ci \
  && npm run build \
  && chmod +x scripts/demo-start.sh \
  && mkdir -p /tmp/stampa \
  && chown -R user:user /src /tmp/stampa

USER user
ENV HOME=/home/user
ENV NODE_ENV=production
ENV PORT=7860
EXPOSE 7860

CMD ["scripts/demo-start.sh"]
