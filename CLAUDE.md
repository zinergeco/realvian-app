# Realvian — Project Instructions for Claude Code

## What this is

Realvian is a UK property intelligence platform — the data layer above the
listing portals. It scores every UK postcode across 24 dimensions and serves
four stakeholder portals (landlord, investor, agent, developer).

Full strategic context lives in the **Master Business Plan v2** and
**Build Specification v2** documents. Read `BUILD_SPEC.md` before starting
any new feature area.

## Current phase

**Phase 0 is COMPLETE.** Foundations are built and deployed:
monorepo, design tokens, dark/light theme with no flash, core component
library, database schema, marketing homepage.

**Next up: Phase 1 — MVP.** City pages (programmatic SEO), comparison
engine, 5–8 calculators, Stripe tiers, basic CMS.

Update this line at the start of each session.

## Tech stack — do not change without asking

- **Next.js 15** App Router, **React 19**, **TypeScript strict**
- **Tailwind CSS 4** (CSS-first `@theme` config, no tailwind.config.js)
- **PostgreSQL + PostGIS**, **Drizzle ORM**
- **Turborepo** monorepo, **pnpm 10** workspaces
- Deployment: Docker → Coolify → CloudPanel reverse proxy on port **8478**

Planned but not yet added: Better-Auth, Stripe, Resend, Claude API,
MapLibre GL, Elasticsearch (only once page count demands it).

## Non-negotiable design rules

1. **Every colour is a CSS custom property** from `app/globals.css`.
   Never hard-code a hex value in a component. If you need a new colour,
   add it as a token in both `:root` and `.dark` first.
2. **Every screen must work in BOTH light and dark theme.** Test both
   before calling anything done. Dark mode is where accessibility
   regressions hide.
3. **Mobile-first.** Test at 375px minimum. Modal on desktop =
   bottom sheet on mobile (already implemented in `site-header.tsx`).
4. **Never a bare spinner** — use the `Skeleton` component, shaped like
   the content it replaces.
5. Gold (`--color-gold`) is reserved for premium/upgrade CTAs only.
   Coral is for energy/alerts. Rose is for destructive actions and errors.
   Never mix coral and rose — users must not confuse "exciting" with "broken".

## Critical engineering rules

- **NEVER scrape Rightmove, Zoopla, or any listing portal.** Copyright +
  database rights + ToS. Litigated repeatedly in UK courts. Licensed and
  open sources only.
- **ALWAYS validate AI-generated numeric claims** against source data
  before rendering, and show a "data updated [date]" caveat. An inaccurate
  price or crime stat is a Property Misdescriptions risk under Consumer
  Protection Regulations.
- **NEVER commit `.env`.** Keep `.env.example` in sync in the same PR
  whenever a new variable is introduced.
- **Never call Stripe live keys** in a non-production environment.
- ARIA labels and keyboard navigation on every interactive component.
  WCAG AA contrast minimum, verified in both themes.
- Lead-sharing consent UI must be visible at the point of capture, naming
  who will contact the user.

## Architecture conventions

- Shared code goes in `packages/`, never copy-pasted between `apps/`.
- `userRoles` is a join table — a user can hold multiple portal roles
  simultaneously. Never model role as a single enum column on `users`.
- `areas` is the geospatial anchor. Properties, listings, leads and alerts
  all reference it. PostGIS geometry from day one.
- Every API route validates input with Zod and returns errors in one shape:
  `{ error: { code, message } }`.

## How I work

- I have **no technical background**. Explain in plain English, no jargon
  without a definition.
- **Show me the plan before writing code** for anything over ~30 minutes
  of work. List the files you'll touch and wait for my approval.
- Never touch production or run a database migration without asking first.
- UK English in all user-facing copy. GBP currency. DD/MM/YYYY dates for
  users, ISO 8601 internally.
- I push to GitHub from my Mac; Coolify auto-deploys from `main`.
  You cannot push — prepare the commit and tell me.

## Commands

```bash
pnpm install          # install all workspace deps
pnpm dev              # dev server on :3000
pnpm build            # production build (must pass before any push)
pnpm typecheck        # strict TS — must be zero errors
```

## Deployment facts

- Live box: `94.72.141.68` (Debian 12, CloudPanel owns 80/443 + SSL)
- Coolify orchestrator: `164.5.249.70:8000` (builds only, hosts nothing)
- Coolify server name: `turingminds-live-p16g` (NOT `localhost`)
- Port mapping: `127.0.0.1:8478:3000`
- Never start Coolify's Traefik proxy on the live box — CloudPanel owns
  those ports and they will fight.
- Coolify env vars: type with real keystrokes. Scripted input is silently
  discarded by Livewire.
