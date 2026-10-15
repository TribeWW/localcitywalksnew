# Scope: LocalCityWalks

LocalCityWalks is a site where visitors book local walking tours. This plan covers one small slice: an inclusions section on the tour page.

**Build approach:** Tracer Bullet (a thin working path on the real tour page, with the live city name, before any later breadth).
**Workflow:** Prototype (nothing extra after /develop; you rely on the build time self check and your own eye). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (for example `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Tour detail page | Existing | existing |
| 2 | Inclusions section | Slice 1 | done |

## Existing

### 1. Tour detail page · existing
The tour page visitors already use, including the hello banner, Good to know, cancellation, booking, and FAQ.
code in `app/(site)/(marketing)/tours/[city]/[slug]/page.tsx`

## Slice 1: Inclusions

### 2. Inclusions section · done
Show the same inclusions list on every tour page, under Good to know, so visitors can see what the tour includes. Only the city name changes from page to page, and the FAQ question about customizing the experience uses that same city name.
**Done when:** under Good to know and above Cancellation policy, every tour page shows an Inclusions heading and four checked lines: the city walking tour, Private local guide, Local product sampling, and Personalized recommendations. The city name is the display name the breadcrumb already uses, so the Dijon page reads Dijon walking tour. The FAQ question becomes Can I customize this Dijon walking tour? on that page, and its answer stays as it is.
- [x] `/develop inclusions section`
code in `app/(site)/(marketing)/tours/[city]/[slug]/page.tsx`

## Deferred
Out of scope for this pass, kept so the plan stays honest.
- **Not included rows**: a line with a cross for something the tour leaves out, such as entry tickets
- **Per tour lists**: inclusions that can differ from one tour to another
- **FAQ wording**: the entrance tickets answer still tells visitors to look for a "What's included" section

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
