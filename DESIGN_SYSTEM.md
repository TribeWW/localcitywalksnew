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

- Use Pearl Gray background in light mode
- Subtle shadows for depth
- Consistent padding: 24px
- Border radius: 10px

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
- **Loading states**: Smooth, non-jarring animations

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

- Reusable UI components in `components/ui/`
- Page-specific components in `components/[section]/`
- Shared components in `components/shared/`

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
