# LocalCityWalks Design System

## Overview

This document outlines the design principles, styling guidelines, and component standards for the LocalCityWalks platform. Our design system focuses on creating a welcoming, trustworthy, and accessible experience for users booking guided walking tours.

## Typography

### Primary Font: Outfit

- **Font Family**: Outfit (Google Fonts)
- **Variable**: `--font-outfit`
- **Weights Available**: 100, 200, 300, 400, 500, 600, 700, 800, 900
- **Usage**: Primary font for all text content across the application

### Font Weights Guidelines

- **100-300**: Light text, subtle elements
- **400**: Body text, default weight
- **500**: Medium emphasis, subheadings
- **600-700**: Strong emphasis, headings
- **800-900**: Heavy emphasis, hero text, important CTAs

## Color Palette

### Brand Colors

Our color palette is inspired by vibrant, warm tones that evoke the excitement of city exploration:

#### Primary Brand Colors

- **Tangerine** `#ff5500` - Primary brand color, used for CTAs and key interactive elements
- **Grapefruit** `#d52410` - Secondary brand color, used for accents and highlights
- **Nightsky** `#333333` - Dark text and important UI elements
- **Watermelon** `#040606` - Deep dark color for backgrounds and contrast
- **Pearl Gray** `#f7f7f7` - Light background color, subtle borders

In Tailwind v4 theme (`app/globals.css` `@theme inline`), brand colors map to utilities such as **`bg-tangerine`**, **`text-watermelon`**, **`bg-pearl-gray`**, etc. Prefer these tokens over arbitrary hex values when matching brand UI.

### shadcn UI tokens (globals)

The app uses **shadcn-style CSS variables** in `:root` / `.dark` for primitives such as **`background`**, **`foreground`**, **`border`**, **`muted`**, **`muted-foreground`**, **`primary`**, **`ring`**, and **`radius`**. Tailwind maps them to classes like **`bg-background`**, **`text-foreground`**, **`border-border`**, **`text-muted-foreground`**.

- Secondary / helper copy often uses **`text-muted-foreground`**. The project sets **`--muted-foreground`** to **`#6A6A6A`** (light mode) for consistent gray body/supporting text alongside brand colors.

### Usage Guidelines

- **Tangerine**: Primary buttons, links, important CTAs, brand highlights
- **Grapefruit**: Secondary actions, warnings, accent elements
- **Nightsky**: Primary text, headings, important information
- **Watermelon**: Dark mode backgrounds, high contrast elements
- **Pearl Gray**: Light backgrounds, card backgrounds, subtle separators

### Accessibility

- All color combinations meet WCAG AA contrast requirements
- Color is never used as the sole means of conveying information
- Dark mode support is built into the design system

## Spacing System

### Base Unit: 4px

Our spacing system is based on a 4px grid for consistency:

- **4px** (0.25rem) - Minimal spacing
- **8px** (0.5rem) - Small spacing
- **12px** (0.75rem) - Medium-small spacing
- **16px** (1rem) - Base spacing unit
- **24px** (1.5rem) - Medium spacing
- **32px** (2rem) - Large spacing
- **48px** (3rem) - Extra large spacing
- **64px** (4rem) - Hero spacing

## Border Radius

### Consistent Rounding

- **Base Radius**: `0.625rem` (10px)
- **Small**: `calc(var(--radius) - 4px)` (6px)
- **Medium**: `calc(var(--radius) - 2px)` (8px)
- **Large**: `var(--radius)` (10px)
- **Extra Large**: `calc(var(--radius) + 4px)` (14px)

## Component Guidelines

### Buttons

- Primary buttons use Tangerine background with white text
- Secondary buttons use transparent background with Tangerine border
- Hover states should provide clear visual feedback
- Minimum touch target size: 44px

### Cards

#### General

- Use Pearl Gray background in light mode (legacy layout)
- Subtle shadows for depth
- Consistent padding: 24px (legacy text block only)
- Border radius: `rounded-xl` (10px–12px)

#### Listing tour cards (`CityCard`)

Home (`#cities`), explore catalog, and paginated home grids use **`components/cards/CityCard.tsx`**. Behaviour is gated by the Vercel flag **`cards-widget-update`** (see [Listing city cards — data & architecture](./LISTING_CITY_CARDS.md)).

| Variant | When | Layout |
| ------- | ---- | ------ |
| **Minimal** (current product) | Flag **on** | Full-bleed photo, bottom gradient overlay, text on image |
| **Legacy** | Flag **off** | Photo on top, title + subtitle below on white card |

**Minimal card — content (flag on)**

| Element | Copy / rule | Notes |
| ------- | ----------- | ----- |
| **Title** | `Hello {city}` | City from `googlePlace.city` (or product title in data) |
| **Subtitle line** | `Private tour` | Shown instead of price while `SHOW_CARD_PRICES` is `false` in `CityCard.tsx` |
| **Price** (hidden) | `From {amount} / adult` | Enrichment still runs server-side; set `SHOW_CARD_PRICES = true` to show formatted headline (e.g. `€124`) |
| **Rating** | `★ {label}` pill, top-right | One decimal (e.g. `4.7`); hidden if no per-tour or global rating |
| **Image alt** | `{city} photo` | Not the `Hello …` headline |

**Minimal card — visual**

- **Aspect ratio:** `3/2` on small screens, `4/5` from `md` up
- **Image:** `object-cover`, slight zoom on hover (`group-hover:scale-105`)
- **Overlay:** `bg-gradient-to-b` transparent → `black/80` at bottom
- **Title:** `text-lg font-semibold text-white` with light text-shadow
- **Subtitle / price line:** `text-sm text-white/90`
- **Rating pill:** `bg-white/95`, `text-nightsky`, `rounded-full`, Lucide **Star** `size-3`
- **Card chrome:** `rounded-xl`, `shadow-sm`, hover lift (`-translate-y-1`, stronger shadow)
- **Link:** Entire card is one `<Link>` to `/tours/{citySlug}/{slug}`

**Legacy card — content (flag off)**

- **Title:** Plain city name
- **Subtitle:** `Private tour` (centered below title)

**Grid**

- `grid-cols-1` → `md:2` → `lg:3` → `xl:4`
- Gap: `gap-x-6 gap-y-6`
- Optional `noHorizontalPadding` when parent supplies horizontal padding (e.g. home spotlight band)

**Do not**

- Fetch price or ratings from the client per card (all enrichment is server-side)
- Use Bókun search `price` as the card headline (use `price-list` enrichment when prices are shown)

For Bókun vs Sanity responsibilities, enrichment pipeline, and parent components, see **[Listing city cards — data & architecture](./LISTING_CITY_CARDS.md)**. For Bókun API details, see **[BOKUN_CONFIGURATION.md](./BOKUN_CONFIGURATION.md)**.

### Forms

- Clear labels and helpful error messages
- Consistent input styling with focus states
- Use Nightsky for text, Pearl Gray for backgrounds
- Validation states should be clear and accessible

### Navigation

- Clear hierarchy with consistent spacing
- Active states should be obvious
- Mobile-first responsive design
- Smooth transitions between states

**Global chrome** (see `app/layout.tsx`):

- **`components/shared/Navbar.tsx`**: Sticky white bar; logo links home; primary CTA **Browse tours** → `/#cities`; mobile menu uses shadcn **Sheet** (left drawer).
- **`components/shared/Footer.tsx`**: Light footer — logo, short tagline, copyright (minimal; expandable later).

Tour pages add in-content navigation (e.g. **Breadcrumb**) in `app/tours/[city]/[slug]/page.tsx`.

## Responsive Design

### Breakpoints

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Mobile-First Approach

- Design for mobile first, then enhance for larger screens
- Touch-friendly interface elements
- Readable text sizes on all devices
- Optimized images and assets

## Animation & Transitions

### Principles

- Subtle and purposeful animations
- Fast enough to feel responsive (200-300ms)
- Easing functions for natural movement
- Reduced motion support for accessibility

### Common Transitions

- **Hover effects**: 200ms ease-in-out
- **Page transitions**: 300ms ease-in-out
- **Loading states**: Smooth, non-jarring animations; use skeleton placeholders (e.g. card-shaped pulses) for list/grid loading to avoid layout shift.

## Accessibility Standards

### WCAG 2.1 AA Compliance

- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators for all interactive elements

### Best Practices

- Semantic HTML structure
- Alt text for all images
- ARIA labels where appropriate
- Color is never the sole means of conveying information
- Support for reduced motion preferences

## Content Guidelines

### Voice & Tone

- **Friendly**: Approachable and welcoming
- **Trustworthy**: Professional and reliable
- **Local**: Authentic and community-focused
- **Clear**: Simple, direct communication

### Writing Style

- Use active voice
- Keep sentences short and clear
- Avoid jargon and technical terms
- Focus on benefits and experiences
- Include local context and authenticity

## File Organization

### CSS Structure

- Global styles in `app/globals.css`
- Component-specific styles in component files
- Utility classes via Tailwind CSS
- Custom CSS variables for consistent theming

### Component Library

- Reusable UI components in `components/ui/` (Radix-based primitives: **Button**, **Dialog**, **Sheet**, **Accordion**, **Breadcrumb**, **Card**, etc.)
- Feature components in `components/home/`, `components/tours/`, `components/forms/`, etc.
- Listing tour grids: **`components/cards/CityCard.tsx`** — see [Listing city cards](./LISTING_CITY_CARDS.md) and **Cards** above
- Shared layout/marketing in `components/shared/` (**Navbar**, **Footer**)

Radix imports should use **scoped packages** (e.g. `@radix-ui/react-accordion`, `@radix-ui/react-slot`), not the umbrella `radix-ui` meta-package.

## Future Considerations

### Planned Enhancements

- Icon system standardization
- Advanced animation library
- Enhanced dark mode support
- Component documentation with Storybook
- Design token system expansion

### Maintenance

- Regular accessibility audits
- Performance monitoring
- User feedback integration
- Design system versioning

---

_This design system is a living document that will evolve with the LocalCityWalks platform. Regular updates and refinements will be made based on user feedback and design best practices._
