# Sanity

## Overview

This area is the CMS for cities, tour SEO, the promo banner, and the home spotlight. The public site reads published documents. Sync jobs and dev tools write through a separate client.

## Key files

| File | Owns |
|---|---|
| `lib/client.ts` | Public read client (CDN) |
| `lib/write-client.ts` | Mutations. Throws if `SANITY_WRITE_TOKEN` is missing |
| `schemaTypes/` | Document types for the site content |
| `structure.ts` | Studio desk layout |
| `env.ts` | Public Sanity env and the API version |

## Conventions

- Public reads use the CDN client. Mutations use the write client.
- Site queries skip drafts with `!(_id in path("drafts.**"))`.
- Studio is mounted at `/studio`. Use the write client only from server code.

## Gotchas

- Importing `lib/write-client.ts` throws when `SANITY_WRITE_TOKEN` is missing.
- Sync and some dev routes use `perspective: 'raw'`, so drafts show up there. Public pages do not.

## Agent skills

- [sanity-best-practices](../.agents/skills/sanity-best-practices/): `sanity-io/agent-toolkit`, Sanity schema, GROQ, and next-sanity
- [content-modeling-best-practices](../.agents/skills/content-modeling-best-practices/): `sanity-io/agent-toolkit`, Content model design
- [seo-aeo-best-practices](../.agents/skills/seo-aeo-best-practices/): `sanity-io/agent-toolkit`, SEO and answer engine content
- [sanity-live-cache-components](../.agents/skills/sanity-live-cache-components/): `sanity-io/next-sanity`, Live preview and cache for next-sanity

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
