# Realvian

UK property intelligence platform. The data layer above the listing portals.

**Phase 0 complete** — foundations + marketing homepage.

## Quick start

```bash
pnpm install
pnpm dev          # → http://localhost:3000
```

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build — must pass before pushing |
| `pnpm typecheck` | Strict TypeScript — must be zero errors |

## What's in Phase 0

**Foundations**
- Turborepo monorepo (pnpm workspaces)
- Complete design token system — light + dark, every colour defined once
- Dark/light theme with zero flash (cookie + blocking inline script)
- Component library: Button, Card, Badge, Input, Skeleton, ThemeToggle
- Database schema: PostGIS, multi-role users, areas as geospatial anchor

**Homepage**
- Live area intelligence panel (the signature element)
- Postcode search with keyboard navigation
- Four portal cards, six capability cards, CTA, footer
- Mobile bottom-sheet menu with safe-area insets

## Structure

```
apps/marketing/       # realvian.co.uk — the public site
  app/                # routes + global tokens
  components/         # UI + feature components
packages/db/          # Drizzle schema, migrations
Dockerfile            # 3-stage build for Coolify
CLAUDE.md             # instructions for Claude Code sessions
```

## Deployment

Docker → Coolify → CloudPanel reverse proxy.

- Live box: `94.72.141.68` (CloudPanel owns 80/443 + SSL)
- Coolify: `164.5.249.70:8000` (builds only)
- Port mapping: `127.0.0.1:8478:3000`

Push to `main` and Coolify deploys automatically.

## Before you build features

Read `CLAUDE.md`. It contains the non-negotiable design and engineering
rules — notably: never hard-code a colour, always test both themes, and
never scrape listing portals.
