#!/bin/sh
# Start the public demo. Hugging Face Spaces set PORT=7860 and SPACE_HOST.
set -eu

export NODE_ENV=production
export STAMPA_DEMO=true
export STAMPA_GATEWAY=fake
export STAMPA_FAKE_LATENCY_MS="${STAMPA_FAKE_LATENCY_MS:-0}"
export STAMPA_OPERATORS="${STAMPA_OPERATORS:-ops@stampa.ng}"
export OTP_PEPPER="${OTP_PEPPER:-stampa-public-demo-pepper-not-a-secret}"
export DATABASE_URL="${DATABASE_URL:-pglite:///tmp/stampa-demo}"

if [ -n "${SPACE_HOST:-}" ]; then
  export APP_URL="https://${SPACE_HOST}"
elif [ -z "${APP_URL:-}" ]; then
  export APP_URL="http://127.0.0.1:${PORT:-7860}"
fi

exec npx next start -H 0.0.0.0 -p "${PORT:-7860}"
