#!/bin/bash
# The standalone Next.js output doesn't include static assets or the
# public folder by default — this copies them into place first, the
# same manual step this project has used for every local verification
# screenshot all session, now scripted so Playwright's webServer can
# run it automatically instead of it being a thing a human remembers.
set -e
cd "$(dirname "$0")/.."

mkdir -p .next/standalone/apps/marketing/.next
cp -r .next/static .next/standalone/apps/marketing/.next/
if [ -d public ]; then
  cp -r public .next/standalone/apps/marketing/ 2>/dev/null || true
fi

PORT=3100 node .next/standalone/apps/marketing/server.js
