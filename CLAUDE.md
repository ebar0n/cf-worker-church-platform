# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the official website for El Jordan Seventh-day Adventist Church (Ibagué, Colombia). It's a Next.js application deployed on Cloudflare Workers with D1 database, designed following [adventist.design](https://www.adventist.design/) guidelines for visual consistency with the global Adventist Church brand. UI copy is in Spanish.

## Development Commands

### Initial Setup

```bash
nvm use                    # Node pinned by .nvmrc (v22.13.0)
make env                   # yarn 3.6.4 + nodeLinker node-modules (.yarnrc.yml is gitignored) + install
cp .dev.vars.example .dev.vars
yarn cf:typegen            # Regenerate cloudflare-env.d.ts after changing bindings in wrangler.jsonc
yarn db:generate           # Generate Prisma client
yarn db:migrate            # Apply migrations to the LOCAL D1 (wrangler default)
```

### Development Workflow

```bash
yarn dev                   # Next dev (Turbopack); bindings come from wrangler via initOpenNextCloudflareForDev
yarn format                # Prettier
yarn lint                  # ESLint
yarn tsc --noEmit          # Typecheck (CI runs this)
```

CI (`.github/workflows/ci.yml`) runs `prettier --check`, lint, typecheck, `yarn test:coverage`, then `yarn cf:build` + `yarn test:e2e`.

### Testing

```bash
yarn test                                   # unit (node) + components (jsdom) projects
yarn test tests/unit/csv.test.ts            # single file
yarn test --project unit                    # one Vitest project
yarn test -t "name of test"                 # filter by test name
yarn test:e2e                               # E2E against the built worker in workerd
yarn test:e2e tests/e2e/friend.test.ts      # single E2E file
```

- `tests/unit/` — pure logic in `src/lib` and `src/middleware.ts`
- `tests/components/` — React components per the Next.js Vitest guide (async Server Components can't be tested here; E2E covers them)
- `tests/e2e/` — one file per domain, covering every API (public + admin) and every landing. `global-setup.ts` applies migrations to local D1, starts `wrangler dev` with the Turnstile test secret via `--var` (never touches `.dev.vars`), and sweeps seeded data (E2E-prefixed titles / fixed document IDs from `tests/e2e/config.ts`) before and after each run. It builds only if `.open-next/worker.js` is missing — **re-run `yarn cf:build` after code changes** or E2E tests the stale bundle.

### Deployment

```bash
yarn deploy                                              # Build + deploy
yarn cf:build / yarn cf:deploy                           # Split build and deploy
yarn preview                                             # Build and run the worker locally
yarn cf:secrets                                          # Push .dev.vars to Worker secrets
npx wrangler d1 migrations apply church-jordan --remote  # Apply migrations to production D1
```

## Architecture

### Stack

Next.js 16.2 (App Router) + React 19 on Cloudflare Workers via `@opennextjs/cloudflare`; TailwindCSS v4; Radix UI primitives; React Hook Form + Zod 4; D1 (SQLite) + R2.

### Bindings (`wrangler.jsonc`)

Accessed with `getCloudflareContext().env` from `@opennextjs/cloudflare`:

- `DB` — D1 `church-jordan`
- `UPLOADS` — R2 `church-jordan` (course images, payment proofs, program attachments); served back through `/api/files/[...path]` and `/api/admin/files/[...path]`
- `IMAGES` — Cloudflare Images, used to convert/crop attachments when building family PDFs (`pdf-lib`)
- Secrets: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`; `NEXTJS_ENV=development` locally

### Database

- **Runtime access is raw D1 SQL only** — every route does `env.DB.prepare(sql).bind(...).first()/.all()/.run()`. The generated Prisma client is not imported anywhere.
- `src/schema.prisma` is the schema reference; the source of truth is the hand-written SQL in `migrations/` (applied by wrangler). A schema change means a new numbered `migrations/NNNN_*.sql` **and** a matching edit to `schema.prisma`.
- Models: `Member`, `FriendRequest`, `Announcement`, `Program`, `Child`, `ChildGuardian`, `Enrollment`, `HealthProfile`, `ProgramAdultEnrollment`, `VolunteerEvent`, `VolunteerRegistration`, `Course`, `CourseEnrollment`, `HealthSurvey`.
- Members and children are identified by `documentID` (cédula); children link to members through `ChildGuardian`.

### Auth model

- **Admin** (`/admin/*`, `/api/admin/*`): no in-app auth. Protected by Cloudflare Access at the edge; pages read the user from the `cf-access-authenticated-user-email` header.
- **Public forms**: wrap handlers in `withTurnstileProtection` (`src/lib/turnstile.ts`). Write endpoints need a fresh token; read-only lookups inside multi-step forms pass `{ allowFormPass: true }` to accept a short-lived HMAC-signed `form_pass` cookie instead (Turnstile tokens are single-use). Turnstile **test** keys are used automatically when `NEXTJS_ENV=development` or on localhost / `*.workers.dev` previews.
- There is no member login yet — the cédula acts as identifier. See `specs/member-auth.md` for the planned design.

### Caching (`src/middleware.ts`)

Workers Cache is enabled (`cache.enabled` in wrangler). The middleware sets `CDN-Cache-Control` for an explicit allowlist of public GET APIs and SSR landings (`/curso/*`, `/volunteer/*`, `/program/*`, `/announcements/*`); everything else under `/api` and `/admin` gets `private, no-store`. Adding a public, cacheable route means adding a rule there (and to the matcher). `/api/files` is excluded and sets its own immutable headers. Static asset headers live in `public/_headers`.

### Main domains

- Members (`/member`, `/api/member`, `/api/members/search`) — multi-step registration/update form
- Friends/visitors (`/friend`, `/api/friend`)
- Programs (`/program/[id]`, `/api/programs/[id]/*`) — family enrollment of children and adults with health profiles, consent, emergency contacts, file uploads; admin roster, CSV and PDF generation (`src/lib/program-*.ts`). `src/app/program/[id]/page.tsx` picks the flow by department: `usesFamilyEnrollment()` (clubs) → family flow (`specs/program-family-enrollment.md`), `usesChildEnrollment()` (children's ministry) → per-child form, every other department → document-ID-only adult enrollment (`/api/programs/[id]/register`).
- Courses (`/curso/[slug]`), volunteer events (`/volunteer/[id]`) with health surveys (`specs/health-survey.md`), announcements
- `src/lib/constants.ts` — the 16 church departments (name, code, color, image) used for categorization, filtering and program branding

### Components

- `src/app/components/` shared; `src/app/components/ui/` Radix-based primitives; `src/app/admin/components/` admin-only
- Route-local components live in a `components/` folder next to the page (e.g. `member/components/` holds one component per form step)

## Styling

- Primary purple `#4b207f`; follow adventist.design
- Headings use Advent Sans (`public/fonts/advent-sans-logo.woff2`, exposed as `--font-heading` in `src/app/globals.css`)
- Prettier with `prettier-plugin-tailwindcss` sorts class names — run `yarn format` rather than ordering by hand

## Deployment Context

- Production domain: `iglesiajordanibague.org` (custom domain route); `workers_dev` is off, non-production builds get preview URLs
- Observability logs/traces/issues are configured in `wrangler.jsonc` and must stay there (a deploy without them turns them off)
