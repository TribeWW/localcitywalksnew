# PRD: Dynamic City Cards from Bokun API

**Date**: January 26, 2025  
**Type**: Feature Implementation  
**Status**: Ready for Implementation

## Summary

Replace hardcoded city data with dynamic Bokun product data to power city cards on the homepage, displaying product titles and key photos.

## Problem Statement

Currently, the homepage city cards are loaded from a hardcoded `CITIES` constant in `CityCard.tsx`, which creates maintenance overhead and doesn't reflect real-time product data from our Bokun booking system.

## User Stories

**As a** website visitor  
**I want to** see current available tours from our booking system  
**So that** I can browse tours that are actually bookable

## Acceptance Criteria

- [ ] City cards load from Bokun API instead of hardcoded constants
- [ ] Display product titles and key photos from API data
- [ ] Page loads without breaking existing functionality
- [ ] Error states are handled gracefully with fallback content
- [ ] No public API endpoints exposed (server-side only)
- [ ] Loading states are implemented for better UX

## Bokun API Response Structure (Investigated)

### Request Format

```json
POST /activity.json/search
{
  "page": 0,
  "pageSize": 0,
  "sortField": "BEST_SELLING_GLOBAL"
}
```

### Product Structure

Each product in `response.items[]` contains:

```json
{
  "id": "1077682",
  "title": "Hello Toledo: Private 2-Hour Intro City Walk with Local Guide",
  "locationCode": {
    "location": "Toledo",
    "name": "Toledo"
  },
  "keyPhoto": {
    "id": 9596708,
    "originalUrl": "https://bokun.s3.amazonaws.com/...",
    "derived": [
      {
        "name": "thumbnail",
        "url": "https://imgcdn.bokun.tools/...?w=80&h=80&mode=crop"
      }
    ]
  }
}
```

### Key Findings

- API returns 19 products (1 per city)
- Each product has `title` and `keyPhoto` object
- Use `keyPhoto.derived[].url` where `name: "thumbnail"` for card images
- Response time: ~30ms (well within 2-second target)

## Technical Requirements

### Performance

- Page load time should not increase by more than 500ms
- Implement 15-minute caching strategy
- Handle API timeouts gracefully (5-second timeout)

### Security

- Use server actions only (no public API routes)
- Bokun API credentials remain server-side only

### Integration

- Leverage existing Bokun utilities (`lib/bokun/`)
- Maintain compatibility with existing `CityCard` component
- Support for error fallbacks and loading states

## Data Schema

### TypeScript Interfaces

```typescript
interface BokunProduct {
  id: string;
  title: string;
  locationCode: {
    location: string;
    name: string;
  };
  keyPhoto: {
    id: number;
    originalUrl: string;
    derived: Array<{
      name: string;
      url: string;
    }>;
  };
}

interface CityCardData {
  id: string;
  title: string;
  image: string;
}
```

### Data Flow

Bokun API → Server Action → React Component

## Implementation Plan

### Phase 1: Foundation (15 minutes)

1. **Create TypeScript types** in `types/bokun.ts`
2. **Test Bokun utilities** with search endpoint

### Phase 2: Core Implementation (30 minutes)

3. **Create server action** `lib/actions/getAllProducts.ts`:

   - Call `/activity.json/search` with `{}`
   - Extract `items[]` array
   - Transform to `CityCardData[]` format
   - Extract thumbnail URL from `keyPhoto.derived[].url` where `name: "thumbnail"`
   - Return `{id, title, image}` objects

4. **Modify CityCard component**:

   - Accept `cities: CityCardData[]` prop
   - Replace hardcoded `CITIES` constant
   - Remove click handlers (not clickable yet)

5. **Update Cities component**:
   - Call server action to fetch products
   - Pass data to CityCard component
   - Add loading states

### Phase 3: Polish (15 minutes)

6. **Add simple caching** (15-minute TTL)
7. **Error handling** with fallback to hardcoded cities

## Affected Files

### Files to Create

- `types/bokun.ts` - All Bokun-related TypeScript interfaces
- `lib/actions/getAllProducts.ts` - Server action

### Files to Modify

- `components/cards/CityCard.tsx` - Accept dynamic data
- `components/home/Cities.tsx` - Use server action

## Success Criteria

- ✅ City cards load from Bokun API
- ✅ Display product titles and photos
- ✅ Page loads within 2 seconds
- ✅ Graceful error handling with fallback
- ✅ No breaking changes to existing UI
- ✅ No public API endpoints exposed

## Estimated Timeline: 60 minutes total

**Total: ~60 minutes**

- Foundation: 15 minutes
- Implementation: 30 minutes
- Polish: 15 minutes

This approach is lean, focused, and leverages existing infrastructure while establishing a clean pattern for future Bokun API integrations.
