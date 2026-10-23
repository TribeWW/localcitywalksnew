# Scope: LocalCityWalks

LocalCityWalks is a site where visitors book local walking tours. This plan covers the next slice: home page review cards that show which city a review is about, so praise feels real and leads into the catalogue.

**Build approach:** Tracer Bullet (a thin working path on the real home reviews section, with live review data, before any later breadth).
**Workflow:** Prototype (nothing extra after /develop; you rely on the build time self check and your own eye). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (for example `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Tour detail page | Existing | existing |
| 2 | Inclusions section | Slice 1 | done |
| 3 | Home reviews section | Existing | existing |
| 4 | Home review cards with city context | Slice 2 | in-progress |
| 5 | Tour photo lightbox | Slice 3 | in-progress |

## Existing

### 1. Tour detail page · existing
The tour page visitors already use, including the hello banner, Good to know, cancellation, booking, and FAQ.
code in `app/(site)/(marketing)/tours/[city]/[slug]/page.tsx`

### 3. Home reviews section · existing
The home page already loads recent reviews into a carousel style section and renders them with the shared review card.
code in `components/home/Reviews.tsx` · `components/reviews/HomeReviewsCarousel.tsx` · `components/reviews/ReviewCard.tsx`

## Slice 1: Inclusions

### 2. Inclusions section · done
Show the same inclusions list on every tour page, under Good to know, so visitors can see what the tour includes. Only the city name changes from page to page, and the FAQ question about customizing the experience uses that same city name.
**Done when:** under Good to know and above Cancellation policy, every tour page shows an Inclusions heading and four checked lines: the city walking tour, Private local guide, Local product sampling, and Personalized recommendations. The city name is the display name the breadcrumb already uses, so the Dijon page reads Dijon walking tour. The FAQ question becomes Can I customize this Dijon walking tour? on that page, and its answer stays as it is.
- [x] `/develop inclusions section`
code in `app/(site)/(marketing)/tours/[city]/[slug]/page.tsx`

## Slice 2: Home review cards

### 4. Home review cards with city context · in-progress
On the home page only, each review card names the city and country the walk was about and links into the catalogue, so visitors get proof from a real place and a path to book. Rating only reviews (stars with no written text) stay off the home page. Tour name as the main cue and reuse on tour or region pages stay for a later pass.
**Done when:** the home page review carousel shows only reviews that have written text; each card shows `{city}, {country}` linking to that city’s catalogue tour path; empty looking rating only cards no longer appear there; tour detail review cards are unchanged.
- [x] Design it (spec): `/architect home review cards with city context`
- [ ] Build it: `/develop home review cards with city context`
   - [ ] Server enrich and filter (24 → ≤12, text + unique city/country match): AC-1, AC-3, AC-4, AC-7
   - [ ] Home ReviewCard mockup layout, place Link, clamp / Read more: AC-2, AC-5, AC-6
   - [ ] Unit tests for match, filter, and caps: AC-1, AC-3, AC-7
spec [0001](../specs/0001-home-review-cards-city.md)

## Slice 3: Tour photo lightbox

### 5. Tour photo lightbox · in-progress
Redesign the tour page photo lightbox on top of the open on the right photo fix, keeping the shared dialog, and fit the outside ticket to this gallery (tokens, thumbnail images, and how browsing stays in sync). The tour request modal stays as it is.
**Done when:** every grid photo and the extra photos badge open on that photo, with the counter and active thumbnail matching; arrows, arrow keys, swipe, and thumbnails stay in sync and wrap; Escape, the close button, and a click on the empty black area close it, and a click on the photo or thumbnails leaves it open; from 768px up the thumbnail row stays centred, opens on the active thumbnail (including when you reopen), scrolls with the mouse wheel, shows a fade only where thumbnails are hidden, and loads small images; focus does not jump to close while browsing; under 768px there is no thumbnail row and no arrows, swipe moves one photo and does not move the page or go back, and the photo clears the home indicator; both badges stay on one line and share the frosted control surface with close and the arrows; the lightbox uses the shared dialog. The tour request modal stays as it is.
- [x] Design it (spec): `/architect tour photo lightbox`
- [ ] Build it: `/develop tour photo lightbox`
   - [ ] Lightbox shell on the live gallery (tokens, open, move, close, phone frame): AC-1, AC-2, AC-3, AC-5, AC-6, AC-8, AC-10
   - [ ] Desktop thumbnail row (small images, centre, wheel, fade): AC-4, AC-5, AC-7
   - [ ] Grid badges on one line with the frosted control surface: AC-9
spec [0002](../specs/0002-tour-photo-lightbox.md)

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Not included rows**: a line with a cross for something the tour leaves out, such as entry tickets
- **Per tour lists**: inclusions that can differ from one tour to another
- **FAQ wording**: the entrance tickets answer still tells visitors to look for a "What's included" section
- **Tour name as the main cue**: city is the first ship; tour title can follow if design asks for it
- **Shared card on tour or region pages**: this slice stays home page only
- **Review collection or storage**: how reviews are gathered and saved stays as it is
- **Tour detail review cards**: leave them alone unless a later design reopens reuse
- **Tour request modal layer**: leave the tour request modal layer as written; the lightbox slice does not change it

## Legend

**The decision box.** Every feature that needs a decision carries exactly one sub task whose label ends with `(spec)`. Skills locate it by that `(spec)` suffix. Every other box is an execution box, and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves.

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `planned` (no decision owed) | `/scope` | one box: `/develop <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` plus 2 to 5 milestones; the tier's closing boxes |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` plus milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is | boxes you ran ticked, skipped ones marked skipped |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first. Otherwise go straight to `/develop`. The tag drops once the spec is captured.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (predates this workflow) and `dropped` (kept for history).
- **Approach tag** beside a heading (for example `· Facade`) overrides the project default for that feature. No tag means it inherits the default.
- **Workflow tier tag** beside a heading (for example `· GA`) sets that one feature's rigor above or below the project default. No tag means it inherits. **Prototype** = nothing after `/develop`. **Alpha** = `/check verify`. **Beta** = `/check verify` then `/test`. **GA** = adds a fresh `/check review` then `/document`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link is added by `/architect`, the code path by `/develop`.
