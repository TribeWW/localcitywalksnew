# Rationale: 0002 · Tour photo lightbox

## Context

> ⚠️ Premise note: The mockup is a picture harness. It builds its own overlay, focuses the close button, stops at the first and last photo, and shows a thumbnail row and a caption on a phone. Copying it whole would drop the shared dialog and the behavior you already locked. Build the picture inside `TourImageGallery`. On a phone the row and the caption stay out, so that screen cannot be a copy of the mockup frame.

The tour page already shows a photo grid and a full screen lightbox. Clicking a grid photo opens that photo. The counter, arrows, and arrow keys stay in step with a horizontal scroll strip. That open on the clicked photo behavior is in place and must stay.

What is still weak is the picture and the browsing around it. There is no thumbnail row, the dark margin does not close the lightbox, focus can land on close, and the grid badges do not share a control surface with the lightbox. A phone can also let a sideways swipe move the page or go back.

Photos are Bókun image addresses. The page passes one list: the hero, plus up to eight gallery photos, with duplicates removed. There is no per photo caption in that data. The tour request modal stays as it is. The booking drawer uses its own higher layer and must not treat the lightbox as one of its overlays.

Not deciding leaves the lightbox looking unlike the mockup, and leaves the close, focus, and thumbnail behavior to whoever builds it next.

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

## Rationale

The gallery already opens on the right photo, and the scope keeps the shared dialog and leaves the tour request modal alone. Option 2 throws that away for a harness that only exists so the mockup can run outside the app. Option 3 redraws behavior you rejected once the mockup was on the table: no thumbnail row under 768px, no caption, arrows hidden on a phone, wrap, and focus kept off close.

The stylesheet you pasted names the frosted surface for close, previous, next, and the `+N photos` badge. It does not name the counter. The mockup draws the counter as its own pill, so the counter stays that pill. The badge stays a pill too. A 40px circle cannot hold `+N photos` on one line. The eye icon stays, because the badge already has it and the mockup does not replace that label.

The 4:3 phone stage in the mockup exists to park the caption and the row. Both are absent under 768px, so the phone photo fills the space under the top bar instead. The bottom inset from the mockup stays, so the photo still clears the home indicator. `viewport-fit=cover` is already set on the root layout. Do not set it again.

Wrap stays, but the strip is a straight row. A smooth scroll from the last slide to the first would animate through every photo. That jump is instant. A move to a neighbor in the strip stays smooth, and the counter holds the target while the strip is still moving, which the current test already requires.

Thumbnails use `next/image` on a small Bókun address (160 by 112, two times the 80 by 56 thumbnail). The main photo uses the address the page already passes, also through `next/image`, sized to the visible photo rather than stretched over the whole slide. If the image element covered the slide, a click on the black margin would hit the image and would not close.

No new flag. This is a replacement of one lightbox on the tour page, not a second path to run beside it. Layer 60 is set on this dialog only, matching the request modal's existing layer, without editing that modal. The booking overlay marker stays off this dialog so a raised booking picker is not confused with the lightbox.
