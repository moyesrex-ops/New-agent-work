#!/bin/sh
# Production start. Refuses the fake gateway and demo doors.
set -eu

if [ "${STAMPA_GATEWAY:-}" = "fake" ] || [ -z "${STAMPA_GATEWAY:-}" ]; then
  echo "Production start refuses the fake gateway. Set STAMPA_GATEWAY=partner (or sandbox) and APP_PARTNER_* credentials." >&2
  exit 1
fi

if [ -z "${TERMII_API_KEY:-}" ]; then
  echo "Production start requires TERMII_API_KEY so one-time codes are delivered." >&2
  exit 1
fi

if [ -z "${AGENTMAIL_API_KEY:-}" ] && [ -z "${RESEND_API_KEY:-}" ]; then
  echo "Production start requires AGENTMAIL_API_KEY or RESEND_API_KEY so magic links leave the server." >&2
  exit 1
fi

if [ -n "${SPACE_HOST:-}" ]; then
  export APP_URL="https://${SPACE_HOST}"
elif [ -z "${APP_URL:-}" ]; then
  export APP_URL="http://127.0.0.1:${PORT:-7860}"
fi

exec npx next start -H 0.0.0.0 -p "${PORT:-7860}"
