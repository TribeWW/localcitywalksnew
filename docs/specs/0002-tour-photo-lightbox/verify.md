# Verify: Tour photo lightbox · spec 0002 · updated 2026-10-27
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] On a desktop tour grid, click photo 3 → lightbox opens on that photo, counter reads `3 / 7`, strip is already there with no slide through earlier photos → AC-1
- [ ] With more than four photos, click the extra photos badge on the fourth tile → opens photo 4, counter reads `4 / N` → AC-2
- [ ] Under 768px, tap the single preview → opens photo 1; arrows and thumbnail row are hidden (including sideways); swipe moves one photo and does not move the page or go back → AC-3
- [ ] At 768px and up with 2+ photos → thumbnail row and arrows visible; cross 768px while open → same photo stays centred, row shows or hides; with one photo → no arrows, no row, counter `1 / 1` → AC-4
- [ ] Arrows, arrow keys, swipe, and thumbnail clicks stay in sync with counter and active thumbnail; neighbor move animates; wrap and far jumps go straight there; counter holds the target while a smooth move is in flight → AC-5
- [ ] Escape, Close photos, and a press and release on the empty black area close it; click on photo, thumbnail, counter, or arrow leaves it open; a swipe does not close; focus is not on close on open or photo change; Tab can still reach close → AC-6
- [ ] Active thumbnail is centred on open, while browsing, and on reopen; wheel over the row scrolls the row sideways only; wheel over the photo does not change the photo; 32px fade only on an edge that still hides thumbnails; Bókun thumbs use `w=160` and `h=112` → AC-7
- [ ] A photo that fails to load keeps its place in the count and in the row as an empty dark frame; browsing continues → AC-8
- [ ] No caption under the photo; desktop badge shows eye + `+N photos` on one line; phone badge shows `N photos`; both use the frosted photo control surface with nightsky text; close and arrows are 40px circles on that surface; counter is the separate white/10 pill → AC-9
- [ ] Shared dialog, backdrop black at 96% opacity, 64px top bar, 8px photo radius, desktop 64px side inset, layer 60, no `data-booking-stacked-overlay`; tour request modal unchanged → AC-10

## Value sourcing
- [ ] Desktop tile click → active index matches the tile (`0` to `3`; badge tile is index `3`) → AC-1, AC-2
- [ ] Phone preview click → active index is always `0` → AC-3
- [ ] Counter text is `activeIndex + 1` / `images.length` → AC-1, AC-5
- [ ] Main image uses `images[activeIndex]` unchanged; alt is `` `${title} image ${index + 1}` `` and is not shown as a caption → AC-8, AC-9
- [ ] Thumbnail URL derives `w=160` and `h=112` on `imgcdn.bokun.tools`, otherwise the same address → AC-7
- [ ] Thumbnail and arrow visibility follow `md` (768px) and `images.length > 1` only → AC-3, AC-4
- [ ] Wrap uses `(index ± 1)` modulo length; neighbor scroll is `smooth`; open, wrap, and non neighbor jumps are `instant` → AC-5
- [ ] Backdrop close only when pointer down and up both hit a backdrop mark (image is not backdrop) → AC-6
- [ ] Wheel over an overflowing row changes `scrollLeft` only, not `activeIndex` → AC-7
- [ ] Fade masks appear only when that side has leftover scroll past 1px → AC-7
- [ ] Thumbnail centre uses `getBoundingClientRect` (instant on open, smooth after) → AC-7
- [ ] Desktop badge label is `max(0, length - 4)` when greater than zero; phone badge is `length` when greater than 1 → AC-9
- [ ] Close `aria-label` is `Close photos`; dialog title is `Tour photos`; initial focus is dialog content (`tabIndex={-1}`), not close → AC-6, AC-10
- [ ] Control surface uses `--photo-control-*` tokens; backdrop is `rgba(0, 0, 0, 0.96)`; dialog overlay and content use `z-[60]` → AC-9, AC-10
- [ ] Bottom inset is `max(24px, env(safe-area-inset-bottom))` on the phone photo stage and on the desktop thumb row → AC-3, AC-10
- [ ] Failed image keeps its URL in `images` (no removal on error) → AC-8

## Commands
- [ ] `npm test -- components/tours/tour-image-gallery.test.tsx lib/bokun/resize-bokun-lightbox-thumbnail-url.test.ts` → all tests pass → AC-1, AC-2, AC-5, AC-7, AC-8, AC-10

## Acceptance-criteria coverage
- AC-1 covered by open photo 3 step and desktop tile value sourcing
- AC-2 covered by badge open step and badge index sourcing
- AC-3 covered by phone frame step and phone preview / visibility sourcing
- AC-4 covered by desktop row and arrows step and visibility sourcing
- AC-5 covered by sync / wrap / counter hold step and scroll behavior sourcing
- AC-6 covered by close / focus step and backdrop / focus sourcing
- AC-7 covered by thumbnail row step and thumb / wheel / fade / centre sourcing
- AC-8 covered by failed load step and failed image sourcing
- AC-9 covered by badges and chrome step and badge / control surface sourcing
- AC-10 covered by dialog shell step and layer / backdrop / names sourcing
