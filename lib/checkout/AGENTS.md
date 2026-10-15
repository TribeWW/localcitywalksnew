# Checkout

## Overview

This area takes a guest from the booking widget to a paid Stripe Checkout session, then fulfils the booking. It exists so the site can charge and confirm a tour without handing the whole flow to Bókun.

## Key files

| File | Owns |
|---|---|
| `handoff.actions.ts` | Thin server action that starts the handoff |
| `start-checkout-handoff.ts` | Creates the pending checkout and the handoff token |
| `payment.actions.ts` | Thin server action that starts payment |
| `initiate-checkout-payment.ts` | Creates the Stripe Checkout session |
| `pending-checkout-store.ts` | Redis lifecycle for a pending checkout |
| `checkout-id.ts` | New `WKS` ids and the legacy UUID window |
| `handle-checkout-session-completed.ts` | Fulfils a paid session after the webhook |

## Conventions

- Keep `"use server"` in the `*.actions.ts` files only. Put the logic in a plain module so Vitest can import it.
- Expected failures return `{ success, error }`.
- A new checkout id is `WKS` plus 9 letters or digits. A legacy UUID is accepted only until the sunset time in `checkout-id.ts`.
- Pending checkout state lives in Redis (`KV_REST_*` or `UPSTASH_REDIS_*`).

## Gotchas

- If Redis is missing, checkout stops. It does not continue without a store.
- The cancel return has to match the handoff that created the checkout.
- The Stripe webhook claims the event id in Redis before fulfilment. If the work fails in a way that can be retried, the claim is released.

## Commands

Live checkout checks stay off unless you set `RUN_CHECKOUT_INTEGRATION_TESTS` and run `npm run test:integration:checkout`.

## Agent skills

- [stripe-best-practices](../../.agents/skills/stripe-best-practices/): `stripe/ai`, Stripe Checkout, webhooks, and key handling
- [stripe-docs](../../.agents/skills/stripe-docs/): `stripe/ai`, Stripe documentation lookup
- [upstash-redis-js](../../.agents/skills/upstash-redis-js/): `upstash/skills`, Upstash Redis client usage

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
