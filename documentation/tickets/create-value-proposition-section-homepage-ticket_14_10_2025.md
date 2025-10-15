# Value Proposition Section for LocalCityWalks

## Overview

Create a mobile-responsive, inspiring value proposition section on the homepage that highlights LocalCityWalks' key differentiators. The section should seamlessly integrate with the existing design system and enhance user engagement by clearly communicating our unique value.

## Core Features

### Content Structure

- **Hero Message**: "Discover the heart of the city with a local guide"
- **Four Value Props**: Led by locals, Small groups, Authentic insights, Trusted & vetted
- **Visual Elements**: Consistent iconography with brand colors (Tangerine/Grapefruit accents)

### Design Requirements

- Clean, minimalist layout with white background
- Icon + title + description pattern for each value prop
- Responsive grid layout (4 columns on desktop, stacked on mobile)
- Consistent spacing using 4px grid system
- Outfit font family with proper weight hierarchy

## Technical Requirements

### Implementation

- Create new React component: `components/home/ValueProposition.tsx`
- Use Tailwind CSS for styling with design system colors
- Implement responsive breakpoints (mobile-first approach)
- Add subtle hover animations (200ms ease-in-out)
- Ensure WCAG AA accessibility compliance

### Integration

- Position between hero section and AboutUs component
- Maintain consistent padding and margins with existing sections
- Use existing icon assets or create new ones following brand guidelines

## Success Criteria

### Functional

- ✅ Section renders correctly on all device sizes
- ✅ Smooth hover interactions on value prop cards
- ✅ Proper semantic HTML structure
- ✅ Accessible to screen readers

### Design

- ✅ Matches design system color palette and typography
- ✅ Consistent with existing page layout and spacing
- ✅ Professional, trustworthy visual appearance
- ✅ Clear hierarchy and readability

### Performance

- ✅ Fast loading with optimized assets
- ✅ No layout shift during render
- ✅ Smooth animations without jank

## Priority: High

## Estimated Effort: 1-2 days

### Breakdown

- Component creation and styling: 4-6 hours
- Responsive design implementation: 2-3 hours
- Integration and testing: 2-3 hours
- Polish and accessibility: 1-2 hours
