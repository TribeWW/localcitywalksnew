# 0001. Home review cards with city context

**Date**: 2026-10-22
**Status**: In Progress

## Summary

Home page review cards will show which city (and country) a review is about, and only reviews with written text will appear there. The card links to that city’s catalogue tour page so praise also leads into booking. Build this as a thin change on the existing home reviews path and `ReviewCard`, matching the agreed mockup shell with project Tailwind patterns.

## Context

> ⚠️ Premise note: City and country come from matching a review’s Bokun `tourId` to a Sanity city’s `tourPagePath`. That path is only the city’s canonical tour. Reviews for other tours in the same city may be skipped. That is the tradeoff you accepted for a Sanity only resolve path. If the home carousel looks thin in production, the next step is a richer resolve (for example Bokun place data), not a silent change to this rule.

Visitors on the home page see recent reviews as stars and a name. Without a place cue, the block reads as generic praise. Rating only reviews also render as empty looking cards. The home reviews carousel and `ReviewCard` already exist; review documents in Sanity stay as they are (collection and storage are out of scope).

The product need is proof from a real walk, a path into the catalogue, and a home only visual that follows a Magic Patterns style mockup shell, implemented with this app’s tokens and patterns rather than copying mockup class names literally.

Not deciding leaves the home social proof weak and keeps empty cards in the carousel.

Public review author names already use a privacy friendly display (`Jane D.`). That pattern stays.

## Requirements

**User stories**:
- As a home page visitor, I want each review to name the city and country and link into that city’s catalogue so I trust it and can explore tours.
- As a home page visitor, I want only written reviews in the carousel so I do not see empty star only cards.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: The home reviews carousel shows only reviews whose body text is non empty after trim.
- **AC-2**: Each home review card shows `{cityName}, {countryName}` as one Next.js `Link` to that city’s `tourPagePath`.
- **AC-3**: A review is omitted when no unique published city matches its `tourId` on `tourPagePath`, or when the country display name is missing.
- **AC-4**: When the enriched list is empty, the home reviews block renders nothing (no empty heading).
- **AC-5**: On home only, card layout is stars, then body (4 line clamp with Read more / Show less when needed), then author via `formatPublicReviewAuthorName`, then `{city}, {country}` · experience date; visuals follow the mockup shell using existing theme classes.
- **AC-6**: Tour detail (and fallback) review cards keep their current presentation; no city line and no home layout change in this slice.
- **AC-7**: The home load path fetches up to 24 recent published reviews, enriches and filters on the server, and returns at most 12 cards.

## Options considered

### Option 1: Enrich at read time via Sanity city `tourPagePath`

Keep the `review` schema unchanged. On the home load path, match each review’s `tourId` to a published city whose `tourPagePath` ends with that id, pull city and country names, filter to text plus successful match, and reshape the home `ReviewCard`.

**Pros**:
- Honours “do not change how reviews are stored”
- One Sanity path; no Bokun fan out on every home view
- Link is the same catalogue URL the footer already uses

**Cons**:
- Only canonical city tours match; other tour ids may drop out
- Needs a careful unique match rule when paths collide

### Option 2: Denormalise city fields onto each Sanity review

Editors (or sync) store city name, country, and href on the review document.

**Pros**:
- Simple card rendering; no join at read time

**Cons**:
- Changes storage and editorial workflow (out of scope for this pass)
- Drift risk when catalogue paths change

### Option 3: Resolve every review through Bokun tour detail

Look up place data per `tourId`, then optionally map to a Sanity city for the link.

**Pros**:
- Can cover non canonical tours

**Cons**:
- Latency and failure modes on the home page
- More moving parts for a Prototype marketing slice

## Decision

**Chosen option**: Option 1: Enrich at read time via Sanity city `tourPagePath`

Home reviews stay Sanity reviews plus a server side enrich and filter against published cities. The home card follows the mockup shell (layout and behaviour) with project patterns; tour detail cards stay untouched.

**Implementation skills**: `nextjs-app-router-patterns` (project, `.agents/skills/nextjs-app-router-patterns/`) · `sanity-best-practices` (`sanity-io/agent-toolkit`, `.agents/skills/sanity-best-practices/`) · `vercel-react-best-practices` (project, `.agents/skills/vercel-react-best-practices/`)

## Rationale

Option 1 matches the scope boundary (no storage change) and the resolve pick you confirmed. Option 2 fights that boundary. Option 3 buys coverage at the cost of home page fan out before you know the carousel is too thin. If AC-3 drops too many cards in production, revisit Option 3 as a follow up, not as a silent expansion of this spec.

Author display stays `formatPublicReviewAuthorName` (`Jane D.`) even though the mockup showed a first name only. Privacy pattern already on the site beats a home only exception.

## Feature design

**Data model sketch**:
- `review` (Sanity, unchanged): `_id`, `tourId` (required digits), `rating`, `experienceDate`, `authorName`, `body` (nullable), `platform` (internal)
- `city` (Sanity, unchanged): `name`, `tourPagePath` (optional relative `/tours/…` path), `country` (required ref to `country`)
- `country` (Sanity, unchanged): `name`
- Home review view (app only, not stored): all public list fields needed by the card, plus `cityName`, `countryName`, `cityHref` when enrichment succeeds

**Match rule**: published city (`!(_id in path("drafts.**"))`) with non empty `tourPagePath` whose path ends with `-{tourId}` (numeric id after the last `-`). If zero or more than one city matches, omit the review.

**State transitions**: none

**API surface**:
| Surface | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Home reviews loader (server action or plain module called from `components/home/Reviews.tsx`) | read | limit cap 24 internally; return cap 12 | enriched home review rows | public | Sanity failure → log, treat as empty list (today’s pattern) |
| City catalogue for match | GROQ read | none (load published cities with path + country name) | name, country name, tourPagePath | public CDN client | failure → empty enrichment, section hides |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Home loader | review body, rating, author, experience date, tourId | Sanity `review` fields via existing recent query shape |
| Home loader | include or exclude row | derived: trimmed `body` non empty AND unique city match AND country name present |
| Home loader | `cityName` | Sanity `city.name` of the unique match |
| Home loader | `countryName` | Sanity `country.name` via `city.country` |
| Home loader | `cityHref` | Sanity `city.tourPagePath` of the unique match |
| Home loader | list length ≤ 12 | derived: after filter, slice to 12 |
| Home `ReviewCard` | star count | `rating` clamped 0–5 as today |
| Home `ReviewCard` | author label | `formatPublicReviewAuthorName(authorName)` |
| Home `ReviewCard` | date label | `formatExperienceDate(experienceDate)` |
| Home `ReviewCard` | body + clamp | `body`; `ReviewBodyClamp` or equivalent at 4 lines |
| Home `ReviewCard` | place link label | derived string `` `${cityName}, ${countryName}` `` |
| Home `ReviewCard` | place link href | `cityHref` via Next.js `Link` |
| Home section visibility | render or null | derived: enriched list length > 0 |

**Key invariants**:
- Tour detail review queries and `presentation="tourDetail"` behaviour do not gain home enrichment fields as requirements.
- Rating only reviews never appear on home.
- Ambiguous or incomplete place data never produces a half filled city line.

**Security model**:
- Public read, same as today’s home reviews. No new auth.
- Author names stay on the existing public display helper (GDPR minded truncation to given name plus family initial).
- No new PII fields; country and city are catalogue place names, not the reviewer’s country of residence.

**Configuration required**: none

**Critical test scenarios**:
- Happy path: recent reviews with body text and unique `tourPagePath` matches appear with city/country link and mockup layout, verifies **AC-1**, **AC-2**, **AC-5**, **AC-7**
- Failure case: rating only, unmatched `tourId`, duplicate path match, or missing country → omitted; all omitted → section null, verifies **AC-3**, **AC-4**
- Auth/permission: anonymous visitor sees the same public cards (no auth gate), verifies **AC-2** as public catalogue links
- Regression: tour detail review list presentation unchanged, verifies **AC-6**

## Build plan

Tracer Bullet: one thin path through data enrich → home UI → empty handling, then visual alignment to the shell.

1. Add a home reviews enrich module (plain TS beside the thin actions file): load up to 24 recent reviews, load published cities with country names, match by `tourPagePath` suffix, filter body + unique match + country, return at most 12 enriched rows; wire `components/home/Reviews.tsx` to it and keep “empty → null”, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-7**
2. Extend the home `ReviewCard` presentation to the mockup order (stars, body clamp, author footer with place `Link` and date) using existing helpers and theme classes; keep tour detail presentation on the old layout, satisfies **AC-2**, **AC-5**, **AC-6**
3. Align clamp / Read more behaviour and spacing with the mockup shell inside current patterns (`ReviewBodyClamp` or a small home specific adjustment), without requiring an `onReadMore` parent callback, satisfies **AC-5**
4. Add or extend unit tests for match/filter helpers and author/date display contracts used on home, satisfies **AC-1**, **AC-3**, **AC-7**

## Consequences

**Positive**:
- Home social proof names a real place and links into the catalogue
- Empty star only cards leave the home carousel
- Storage and tour detail UI stay stable

**Negative / tradeoffs**:
- Canonical path matching can thin the carousel
- Home `ReviewCard` diverges further from tour detail presentation (two layouts to maintain)

**Neutral**:
- Mockup token names map onto existing Tailwind theme utilities rather than new CSS variables
- Overfetch of 24 is a simple headroom knob; tune later if needed

## Follow-up

- [ ] If production shows too few home cards, design a richer `tourId` → city resolve (likely Bokun place data) as a separate spec
- [ ] Optional later: tour name on the card, or reuse the home card on tour/region pages
- [ ] `sanity-best-practices` / App Router skills live under `.agents/skills/` and `sanity/AGENTS.md`; root `AGENTS.md` has no `## Agent skills` list yet (a `/sync` or `/audit` pass can add pointers if you want them at root)

## Migration plan

**Strategy**: no migration needed
**Phases**:
1. Ship enrich + home card changes in one deploy; no Sanity schema change and no data backfill
**Rollback**: revert the deploy; home returns to the previous card and unfiltered recent list
**Risks**: carousel may show fewer cards than before until catalogue `tourPagePath` coverage is good
