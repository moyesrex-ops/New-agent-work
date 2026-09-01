# Hosting Stampa

## Production: Vercel

The public web app is a Next.js server. Static hosts cannot run it.

Follow `apps/stampa/deploy/vercel/README.md`. Root directory `apps/stampa`,
region Cape Town, `STAMPA_GATEWAY=hold` until an accredited access point
exists. Postgres is required. IRNs are never invented.

## Hugging Face Spaces (Docker)

The image in the repository root `Dockerfile` still boots, but production
refuses the fake gateway and demo doors. Supply the same live credentials
as Vercel, including a `postgres://` `DATABASE_URL`.

Direct URL shape: `https://<user>-stampa.hf.space`

## Docker, anywhere

```bash
docker build -t stampa .
docker run -p 7860:7860 \
  -e NODE_ENV=production \
  -e STAMPA_GATEWAY=hold \
  -e DATABASE_URL=postgres://... \
  -e APP_URL=https://example.com \
  -e OTP_PEPPER=... \
  -e TERMII_API_KEY=... \
  -e AGENTMAIL_API_KEY=... \
  stampa
```
