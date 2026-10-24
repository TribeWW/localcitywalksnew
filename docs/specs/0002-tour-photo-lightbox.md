# 0002. Tour photo lightbox

**Date**: 2026-10-23
**Status**: Proposed

## Summary

The tour page lightbox keeps the gallery and the shared dialog you already have, and takes its picture from the mockup. Visitors still open the photo they clicked, move with arrows, keys, swipe, and thumbnails, and close from the dark margin. The thumbnail row is only from 768px up. A phone has swipe, the counter, and close, with no row and no arrows.

## Context

> ⚠️ Premise note: The mockup is a picture harness. It builds its own overlay, focuses the close button, stops at the first and last photo, and shows a thumbnail row and a caption on a phone. Copying it whole would drop the shared dialog and the behavior you already locked. Build the picture inside `TourImageGallery`. On a phone the row and the caption stay out, so that screen cannot be a copy of the mockup frame.

The tour page already shows a photo grid and a full screen lightbox. Clicking a grid photo opens that photo. The counter, arrows, and arrow keys stay in step with a horizontal scroll strip. That open on the clicked photo behavior is in place and must stay.

What is still weak is the picture and the browsing around it. There is no thumbnail row, the dark margin does not close the lightbox, focus can land on close, and the grid badges do not share a control surface with the lightbox. A phone can also let a sideways swipe move the page or go back.

Photos are Bókun image addresses. The page passes one list: the hero, plus up to eight gallery photos, with duplicates removed. There is no per photo caption in that data. The tour request modal stays as it is. The booking drawer uses its own higher layer and must not treat the lightbox as one of its overlays.

Not deciding leaves the lightbox looking unlike the mockup, and leaves the close, focus, and thumbnail behavior to whoever builds it next.

## Requirements

**User stories**:
- As a visitor on a tour page, I want the lightbox to open on the photo I clicked so I am not sent back to the first photo.
- As a visitor, I want arrows, keys, swipe, and thumbnails to stay in step, and to close only when I mean to.
- As a visitor on a phone, I want to swipe between photos without the page moving or the browser going back.
- As a visitor on a larger screen, I want a thumbnail row that shows where I am and lets me jump.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: On a desktop grid, clicking a photo opens the lightbox on that photo. The counter shows that position (for example `3 / 7`). The strip is already on that photo when it appears, with no slide through earlier photos.
- **AC-2**: When there are more than four photos, the extra photos badge sits on the fourth tile and opens photo 4.
- **AC-3**: Under 768px the single preview opens photo 1. Arrows are hidden. There is no thumbnail row, including when the phone is sideways. Swipe moves one photo and does not move the page or trigger browser back.
- **AC-4**: At 768px and up, with more than one photo, the thumbnail row and the arrows are visible. Crossing 768px while open keeps the same photo centred and shows or hides the row. One photo has no arrows and no row, and the counter reads `1 / 1`. No photos: the gallery renders nothing, and the page keeps the unavailable line it already has.
- **AC-5**: Arrows, arrow keys, swipe, and thumbnail clicks stay in sync with the counter and the active thumbnail. A move to the next or previous photo in the strip animates. A longer jump, including wrap from the last photo to the first and from the first to the last, goes straight there without sliding through the photos in between. While an animation is still moving, the counter stays on the target photo. Next and previous wrap.
- **AC-6**: Escape, the close button, and a click on the empty black area close the lightbox. A click closes only when the pointer went down and up on that black area. A click on the photo, a thumbnail, the counter, or an arrow leaves it open. A swipe does not close it. Focus is not on the close button when the lightbox opens or when the photo changes. Tab can still reach close.
- **AC-7**: The active thumbnail is centred in the row on open, while browsing, and when you open again on a photo. The mouse wheel over the row scrolls the row sideways and does not change the photo. The wheel over the photo does not change the photo. A 32px fade shows only on an edge that still hides thumbnails. Each thumbnail asks Bókun for a 160 by 112 image when the address is on `imgcdn.bokun.tools`, otherwise it uses the same address, and thumbnails load lazy.
- **AC-8**: A photo that fails to load keeps its place in the count and in the row. That frame stays empty and dark. Browsing continues.
- **AC-9**: There is no caption under the photo. Both badges stay on one line and use the frosted photo control surface with nightsky text. The desktop badge keeps the eye icon and the `+N photos` label. The phone badge reads `N photos`. Close and the arrows are 40px circles on that same surface. The counter is a separate pill: white at 10 percent, white text, 14px, 8px radius.
- **AC-10**: The lightbox uses the shared dialog, with a visible backdrop of black at 96 percent opacity, a 64px top bar, and 8px radius on the photo. At 768px and up the photo has a 64px side inset and sits centred in the space between the top bar and the thumbnail row. Thumbnails are 80 by 56, with an 8px gap, in a row that is only as wide as its thumbnails, centred, and capped at 768px from the `lg` breakpoint. The active thumbnail has a 2px white outline with a 2px offset. Under 768px the photo fills the space under the top bar, with a 16px side inset and a bottom inset of at least 24px or the home indicator, whichever is larger. This dialog uses layer 60. It does not wear the booking overlay marker. The tour request modal is unchanged.

## Options considered

### Option 1: Restyle the lightbox you already have

Keep `TourImageGallery`, the shared dialog, the scroll strip, and the open on the clicked photo behavior. Apply the mockup picture and the locked browsing rules inside that component. Add only the photo control surface to the existing stylesheet.

**Pros**:
- The open on the clicked photo fix, the dialog focus trap, and the current tests stay.
- One component change, reverted by reverting one commit.

**Cons**:
- The phone screen will not match the mockup frame, because the row and the caption stay off.
- A linear strip cannot animate the wrap from the last photo to the first without flying through every photo, so that move jumps.

### Option 2: Replace the dialog with the mockup overlay

Port the mockup component as the lightbox, including its hand built overlay, and retire the dialog usage in the gallery.

**Pros**:
- The overlay markup matches the harness line for line.
- Backdrop clicks, the thumbnail mask, and the wheel handler come across unchanged.

**Cons**:
- You lose the shared dialog (portal, focus trap, and focus return) that the scope keeps.
- The harness focuses close, stops at the ends, and shows a phone row and a caption, which you ruled out.

### Option 3: Match the mockup behavior as well as the picture

Use the existing gallery, but also take the mockup's phone row, caption, end stops, and initial focus on close.

**Pros**:
- Desktop and phone would both follow the harness.
- Arrow buttons could disable at the ends, which the harness already draws.

**Cons**:
- It drops wrap, the focus rule, and the phone layout you confirmed after seeing the mockup.
- The caption would have to show the tour title or the alt text (`title image 3`), and Bókun gives this page no real caption.

## Decision

**Chosen option**: Option 1: Restyle the lightbox you already have

Rebuild the lightbox picture inside `TourImageGallery` and the shared dialog. Keep the browsing behavior you locked. Take sizes, spacing, and the frosted controls from the mockup and the stylesheet you pasted.

## Rationale

The gallery already opens on the right photo, and the scope keeps the shared dialog and leaves the tour request modal alone. Option 2 throws that away for a harness that only exists so the mockup can run outside the app. Option 3 redraws behavior you rejected once the mockup was on the table: no thumbnail row under 768px, no caption, arrows hidden on a phone, wrap, and focus kept off close.

The stylesheet you pasted names the frosted surface for close, previous, next, and the `+N photos` badge. It does not name the counter. The mockup draws the counter as its own pill, so the counter stays that pill. The badge stays a pill too. A 40px circle cannot hold `+N photos` on one line. The eye icon stays, because the badge already has it and the mockup does not replace that label.

The 4:3 phone stage in the mockup exists to park the caption and the row. Both are absent under 768px, so the phone photo fills the space under the top bar instead. The bottom inset from the mockup stays, so the photo still clears the home indicator. `viewport-fit=cover` is already set on the root layout. Do not set it again.

Wrap stays, but the strip is a straight row. A smooth scroll from the last slide to the first would animate through every photo. That jump is instant. A move to a neighbor in the strip stays smooth, and the counter holds the target while the strip is still moving, which the current test already requires.

Thumbnails use `next/image` on a small Bókun address (160 by 112, two times the 80 by 56 thumbnail). The main photo uses the address the page already passes, also through `next/image`, sized to the visible photo rather than stretched over the whole slide. If the image element covered the slide, a click on the black margin would hit the image and would not close.

No new flag. This is a replacement of one lightbox on the tour page, not a second path to run beside it. Layer 60 is set on this dialog only, matching the request modal's existing layer, without editing that modal. The booking overlay marker stays off this dialog so a raised booking picker is not confused with the lightbox.

## Feature design

**Data model sketch**:

No new stored data. No migration.

| Thing | Fields | Rules |
|---|---|---|
| Photo list (passed in) | `images: string[]`, required, order is the display order. `title: string`, required, for alt text. | Built today on the tour page from the Bókun hero plus up to eight gallery photos, duplicates removed. A photo's identity is its position, starting at zero. |
| Lightbox session (memory only) | `open: boolean`. `activeIndex: number`. | Each open sets `activeIndex` from the photo you clicked. Closing forgets it. |
| Thumbnail address (derived) | Same URL with `w=160` and `h=112` when the host is `imgcdn.bokun.tools`. | Main photo keeps the original list address. If the host is not that CDN, the thumbnail uses the same address. |

One tour page has one gallery. One gallery has many photos, in order. One photo has one main address and one thumbnail address.

**State transitions**:

Closed (no index kept) → open on the clicked index → browsing (index changes) → closed.

| Trigger | From | To |
|---|---|---|
| Grid photo, badge, or phone preview click | Closed | Open on that index |
| Arrow, arrow key, swipe, thumbnail | Open | Browsing, index updated, wrapping at the ends |
| Escape, close button, backdrop click | Open or browsing | Closed, index forgotten |
| Width crosses 768px | Open or browsing | Same index, row shown or hidden |

**API surface**:

| Surface | Kind | Key inputs | Key outputs | Who | Key errors |
|---|---|---|---|---|---|
| `TourImageGallery` | Client component, props unchanged | `images: string[]`, `title: string` | Grid, badges, lightbox | Anyone who can open the tour page | Empty `images`: render nothing. A bad image URL: keep the slot. |

No new route, server action, or prop.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Open from a desktop tile | Active index | The tile index (`0` to `3`). The badge is on the fourth tile, so it is index `3`. |
| Open from the phone preview | Active index | Always `0`. |
| Counter | `activeIndex + 1` and `images.length` | Lightbox session and the `images` prop. |
| Main image address | URL string | `images[activeIndex]`, unchanged. |
| Main image alt | Text | `` `${title} image ${index + 1}` ``. Not shown as a caption. |
| Thumbnail address | URL string | Derived from that photo's list address. `w=160` and `h=112` on `imgcdn.bokun.tools`. Same address otherwise. |
| Thumbnail visibility | Shown or hidden | CSS `hidden` below the `md` breakpoint (768px) and `md:flex` from there, and only when `images.length > 1`. Not tied to viewport height. |
| Arrow visibility | Shown or hidden | Same `md` breakpoint, and only when `images.length > 1`. Never disabled at the ends. |
| Wrap target | Next index | `(index ± 1)` modulo `images.length`. |
| Scroll behavior | `instant` or `smooth` | `instant` on open and on any jump that is not a neighbor in the strip, including wrap across the ends. `smooth` for a neighbor in the strip. |
| Counter during a smooth move | Target index | Held on the target until the strip arrives (existing `programmaticTargetRef` behavior). |
| Backdrop close | Whether the click counts | Pointer down and pointer up both on an element marked as backdrop. The image element is not backdrop. |
| Wheel | Row `scrollLeft` | Vertical wheel delta while the pointer is over the row and the row overflows. Horizontal trackpad movement is left to the browser. Does not change `activeIndex`. |
| Fade | Left and right mask | 32px, only when that side has `scrollLeft` or leftover scroll width past 1px. |
| Thumbnail centre | Row `scrollLeft` | `getBoundingClientRect` of the active thumbnail against the row. Not `offsetLeft`. Instant on open, smooth after that. |
| Badge label | `+N photos` or `N photos` | Desktop: `max(0, images.length - 4)` when that is greater than zero. Phone: `images.length` when it is greater than 1. Desktop eye icon: Lucide `Eye` at 16px (`size-4`), the size the badge already uses. |
| Close and dialog name | Accessible names | Close button `aria-label` is `Close photos`. Dialog title (screen reader only) is `Tour photos`. |
| Initial focus | Focused element | The dialog content (`tabIndex={-1}`). Prevent the dialog's open auto focus so it does not land on close. |
| Control surface | Fill, border, blur | `--photo-control-bg: rgba(255, 255, 255, 0.9)`, `--photo-control-border: rgba(255, 255, 255, 0.3)`, `--photo-control-blur: 8px`, border width 1.5px. Icon and badge text: `text-nightsky` (`#0f172a`). |
| Backdrop color | CSS color | `rgba(0, 0, 0, 0.96)`. |
| Layer | z index class on this dialog only | `z-[60]` on the overlay and the content. Default dialog layer stays 50 for every other dialog. |
| Bottom inset | Padding | `max(24px, env(safe-area-inset-bottom))`. On the row from 768px up. On the photo stage under 768px. |
| Failed image | Slot kept | The URL stays in `images`. No removal on error. |

**Key invariants**:
- Props stay `images` and `title`.
- Closing forgets the index. The next open uses the photo you clicked.
- The visible photo's image element hugs the picture, so the black margin around it is backdrop. Do not use `fill` on the main photo.
- The row is centred with `getBoundingClientRect`, not `offsetLeft`.
- `overscroll-x-contain` on the photo strip and the thumbnail row.
- Radix locks body scroll. Do not add a second body overflow lock.
- Do not import the Magic Patterns stylesheet (Tailwind v3 imports, Google font, or a hand built overlay).
- Do not set `data-booking-stacked-overlay` on this dialog.

**Security model**:

The tour page is public. Anyone who can see it can open the lightbox. No sign in, no new personal data, no new secret. Image addresses are the public Bókun URLs the page already renders. The lightbox must not wear the booking overlay marker.

**Critical test scenarios** (each maps to an acceptance criterion in Requirements):
- Happy path: open photo 3 on a multi photo grid, counter reads `3 / 7`, strip scrolls with behavior `instant`, verifies **AC-1**.
- Happy path: next after that open advances one photo with behavior `smooth`, and a scroll event still on the old photo does not move the counter back, verifies **AC-5**.
- Happy path: next on the last photo and previous on the first wrap, and the strip jumps rather than animating through the list, verifies **AC-5**.
- Happy path: the extra photos badge opens photo 4, verifies **AC-2**.
- Failure case: a thumbnail click far from the current photo uses an instant jump, verifies **AC-5** and **AC-7**.
- Failure case: the image list still contains a URL after a load error would have fired, verifies **AC-8**.
- Auth: no auth gate and no booking overlay attribute on the dialog, verifies **AC-10**.

## Build plan

Tracer Bullet: the first slice is a thin path through the real tour page, the real image list, and the shared dialog (open, move, close). Later slices thicken that path. No schema migration.

1. Lightbox shell on the live gallery. Add the photo control tokens and class to `app/globals.css`. Inside the existing dialog, build the top bar, the scroll strip, backdrop clicks, wrap, focus off close, layer 60, and the phone frame (no arrows, no row, swipe containment, bottom inset). Keep the open on the clicked photo scroll. Extend `components/tours/tour-image-gallery.test.tsx` for open index, wrap, and the counter hold. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, **AC-8**, **AC-10**.
2. Desktop thumbnail row on that shell. Small Bókun addresses, centre on the active thumbnail, wheel, fade, instant long jumps, `hidden` below `md`. Tests for a thumbnail jump and the derived thumbnail address. Satisfies **AC-4**, **AC-5**, **AC-7**.
3. Grid badges. One line, frosted surface, nightsky text, eye icon kept on the desktop badge. Satisfies **AC-9**.

## Consequences

**Positive**:
- The lightbox matches the mockup picture on a larger screen, and the open on the clicked photo behavior stays.
- Close, focus, swipe, and thumbnails have one written contract.
- Rollback is reverting the gallery and stylesheet commit. No data migration and no flag to retire later.

**Negative / tradeoffs**:
- A phone will not look like the mockup's phone frame. There is no row, no caption, and no arrows.
- Wrap across the ends jumps instead of sliding.
- The frosted white badge can glare on a very light photo.
- Every tour page gets the new lightbox in one release, with no flag to turn it off.

**Neutral**:
- The page still passes at most the hero plus eight gallery photos. The row still handles overflow when the window is narrow.
- The tour request modal file is not edited. It already uses layer 60. This dialog joins that layer and does not try to force only one of them open.
- `viewport-fit=cover` is already on the root viewport, so the home indicator inset can be non zero.
