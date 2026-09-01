# Host Stampa on Vercel

The app lives in `apps/stampa`. Set the Vercel **Root Directory** to
`apps/stampa`. The region is **Cape Town** (`cpt1`) — the closest Vercel
region to Nigeria. Do not claim the data is in Lagos.

## What this host can and cannot do

Stampa does not invent IRNs. Until an accredited APP/SI is wired, production
must run as:

```
STAMPA_GATEWAY=hold
```

The public site, OTP, magic links, drafts and the buyer console run. A stamp
attempt fails closed. The supplier is told the access point is not live.
Switch to `sandbox` or `partner` only when `APP_PARTNER_*` credentials exist.

PGlite is refused in production. Serverless filesystems are not a database.
Provision Postgres (Vercel Postgres, Neon, or any `postgres://` host) and set
`DATABASE_URL` before the first deploy. Migrations run at build
(`npx tsx scripts/migrate.mts && next build`).

## Environment

Copy names from `apps/stampa/.env.example`. Required in production:

| Name | Why |
|---|---|
| `DATABASE_URL` | Managed Postgres. Not `pglite://`. |
| `APP_URL` | Public origin, no trailing slash. Every SMS and WhatsApp link is built from it. |
| `OTP_PEPPER` | `openssl rand -base64 32` |
| `STAMPA_GATEWAY` | `hold` until APP credentials exist |
| `TERMII_API_KEY` | One-time codes leave the server |
| `AGENTMAIL_API_KEY` or `RESEND_API_KEY` | Magic links leave the server |
| `CRON_SECRET` | `openssl rand -hex 32`. Vercel sends it as `Authorization: Bearer …` to `/api/cron/retry` |

Never commit `.env.local`. Never paste keys into a pull request.

## Cron

`vercel.json` calls `GET /api/cron/retry` every five minutes. That retries
queued transmissions (none, while on `hold`) and sends day-three invite
nudges. An empty `CRON_SECRET` disables the route (404).

## Health

`GET /api/health` returns JSON. `200` means boot, database and migrations
are fine. `503` names the problem variables, never their values.

## Deploy

From this repository, with the Vercel CLI logged in:

```bash
npx vercel --cwd apps/stampa --prod --yes
```

Or connect the GitHub repository in the Vercel dashboard, set the root
directory to `apps/stampa`, add the environment variables, and deploy.
