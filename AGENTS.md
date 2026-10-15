# localcitywalks

## Stack

- **Language / Runtime**: TypeScript, Node
- **Framework**: Next.js 15 (App Router), React 19
- **Key dependencies**: Sanity 4, Stripe, Bókun, Upstash Redis, Vercel Flags
- **Package manager**: npm

## Build approach

<TBD, set by /scope>

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Test
npm test
```

Also: `npm run lint`, `npm run typecheck`. Live checkout checks stay off unless you set `RUN_CHECKOUT_INTEGRATION_TESTS` and run `npm run test:integration:checkout`.

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Pages and layouts stay Server Components. Interactive surfaces (booking widget, checkout, forms, explore) use `"use client"`.
- Server actions live in `lib/**/*.actions.ts` and stay thin. The real logic sits in a plain module beside them so tests can call it.
- Validate input with Zod in `lib/validation/`.
- Colocate unit tests as `*.test.ts`. `npm test` skips `*.integration.test.ts`.
- Import from the repo root with the `@/` alias.
- Style with Tailwind CSS v4. Shared UI lives in `components/ui/`. Compose classes with `cn()` from `lib/utils.ts`.
- Checkout and booking flows return `{ success, error }` for expected failures.
- The root layout imports `lib/config.ts`, which throws if Bókun or support email env is missing. Cron routes return 401 unless `CRON_SECRET` is set.
- Declare feature flags in `flags.ts`. `cardsWidgetUpdate` gates the widget, cards, and native checkout. `promoCode` gates checkout promos.
- Secrets stay out of git. Local env lives in `.env.local`.

## Context files

- [lib/checkout/AGENTS.md](lib/checkout/AGENTS.md): Native checkout from the booking widget through Stripe and fulfilment.
- [sanity/AGENTS.md](sanity/AGENTS.md): Sanity schema, read and write clients, and draft rules.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
