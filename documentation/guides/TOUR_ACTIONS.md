# Tour Actions Documentation

**Date**: March 27, 2026  
**Type**: Server Actions Implementation  
**Status**: Production Ready

## Overview

This document describes the server actions implementation for fetching and managing tour data from the Bokun API. The implementation provides dynamic city card functionality with comprehensive error handling, caching, and fallback mechanisms.

## Architecture

### Data Flow

```
Bokun API → Server Action → React Component → UI Display
```

### Key Components

- **Server Actions**: `lib/actions/tour.actions.ts` — Bokun search/listing; `lib/actions/tour-detail.actions.ts` — single product by id (tour page)
- **URL helpers**: `slugifyForUrl` in `lib/utils.ts` (shared with the tour page for canonical city slugs)
- **Type Definitions**: `types/bokun.ts` — `CityCardData`, `BokunProductDetail`, result types, etc.
- **UI**: `components/cards/CityCard.tsx` (links to `/tours/{citySlug}/{slug}`), `components/home/Cities.tsx`, `components/home/ToursSectionClient.tsx` (filter + pagination)

## Server Actions

### `getProductsPage(page, countryCode?)`

**Purpose**: Fetches one page of tour products (e.g. 20 items) with optional server-side country filter. Used by the landing tours section for initial load, "Show more", and country filter.

**Returns**: `Promise<GetProductsPageResult>` with `data` and `totalHits`. When `countryCode` is provided, the Bokun request includes `facetFilters` for country; cache key includes country so filtered and unfiltered results are cached separately.

**Sanity sync**: On a **cache miss**, after a successful Bokun response, the action fires **`syncCitiesFromProducts(data.items)`** in the background (same pattern as `getAllProducts`). See `documentation/guides/SANITY-BOKUN-SYNC.md`.

### `getTourDetailById(id)` (tour page)

**Location**: `lib/actions/tour-detail.actions.ts`  
**Purpose**: **`GET /activity.json/{id}`** for the **`/tours/[city]/[slug]`** page (id parsed from slug).  
**Caching**: 15-minute in-memory TTL per product id.  
**Docs**: URL scheme, city validation, and image hosts are described in **`documentation/guides/BOKUN_CONFIGURATION.md`**.

### `getAllProducts()`

**Purpose**: Fetches all available tour products from Bokun API and transforms them into city card data.

**Location**: `lib/actions/tour.actions.ts`

**Returns**: `Promise<GetAllProductsResult>`

#### Implementation Details

```typescript
export async function getAllProducts(): Promise<GetAllProductsResult>;
```

**Features**:

- ✅ **Caching**: 15-minute in-memory cache (global key) to reduce API calls
- ✅ **Timeout Protection**: 5-second timeout to prevent hanging requests
- ✅ **Error Handling**: Returns `{ success: false, error }` on failure; callers may fall back to static data
- ✅ **Data Transformation**: `transformProductToCityCard` — sets `citySlug` (slugified `googlePlace.city` or title), `slug` (`{titleSlug}-{id}`), `countryCode`, `country`, image URL
- ✅ **Image pick**: Prefers `keyPhoto.derived` entry named **`preview`**, else first derived URL, else placeholder

#### Request Flow

1. **Cache Check**: First checks in-memory cache for existing data
2. **API Call**: Makes authenticated request to Bokun `/activity.json/search` endpoint
3. **Data Transformation**: Converts raw product data to city card format
4. **Cache Update**: Stores result in cache for future requests
5. **Return Result**: Returns success/error result with data

#### API Request Structure

```typescript
// Request to Bokun API
POST /activity.json/search
{
  "page": 0,
  "pageSize": 0,
  "sortField": "BEST_SELLING_GLOBAL"
}
```

#### Response Processing

```typescript
// Extract thumbnail URL from keyPhoto
function extractThumbnailUrl(keyPhoto: unknown): string {
  const photoData = keyPhoto as {
    derived?: Array<{ name: string; url: string }>;
  };

  if (!photoData?.derived) {
    return "/placeholder-city.jpg";
  }

  // Prefer preview in derived array (matches tour.actions.ts)
  const thumbnail = photoData.derived.find((item) => item.name === "preview");

  if (thumbnail?.url) {
    return thumbnail.url;
  }

  // Fallback to first available derived image
  const firstDerived = photoData.derived.find((item) => item.url);
  return firstDerived?.url || "/placeholder-city.jpg";
}
```

## Type Definitions

Authoritative types live in **`types/bokun.ts`**. Highlights:

- **`CityCardData`**: `id`, `title` (display city name), `image`, `countryCode`, `country`, **`citySlug`**, **`slug`** (URL segment for the tour page: `titleSlug-id`).
- **`GetProductsPageResult`** / **`GetAllProductsResult`**: `success`, optional `data`, `error`, and for paging `totalHits` where applicable.

Do not duplicate large interface blocks in this guide; update `types/bokun.ts` and reference it here.

## Component Integration

### Cities Component (`components/home/Cities.tsx`)

**Purpose**: Server component that fetches the first page of tours and passes it to the client section for display, filter, and "Show more".

**Key Features**:

- ✅ **Async Server Component**: Calls `getProductsPage(1)` and passes `initialData` + `totalHits` to `ToursSectionClient`
- ✅ **Fallback Mechanism**: Falls back to hardcoded cities if API fails
- ✅ **Error Resilience**: Graceful handling of API failures

The client wrapper `ToursSectionClient` owns the country filter (single-select modal), "Show more" pagination, and skeleton loading when the filter changes. Filtering by country is done server-side via `getProductsPage(1, countryCode)`.

### CityCard Component (`components/cards/CityCard.tsx`)

**Purpose**: Client component that renders city/tour cards and **navigates** to the city-first tour page.

**Key Features**:

- ✅ **`CityCardData[]`** prop; optional **`noHorizontalPadding`** when the parent supplies horizontal padding (e.g. aligned with a filter control).
- ✅ **Links**: Each card wraps content in **`next/link`** to **`/tours/${citySlug}/${slug}`**, with `citySlug` from data or **`slugifyForUrl(city.title)`** fallback.
- ✅ **Images**: `next/image` with **`fill`** and **`aspect-[3/2]`** (`object-cover`).
- ✅ **Layout**: Responsive grid (`md:2`, `lg:3`, `xl:4` columns).

Tour **request** capture lives on the **tour page** (`TourRequestForm` in the sidebar), not on the card.

## Error Handling & Fallback Strategy

### Multi-Level Fallback System

1. **API Success**: Use dynamic data from Bokun API
2. **API Failure**: Fall back to hardcoded `FALLBACK_CITIES` array
3. **Image Loading Failure**: Fall back to placeholder image

### Error Scenarios Handled

- ✅ **Network Timeout**: 5-second timeout with AbortController
- ✅ **API Unavailable**: Graceful fallback to hardcoded cities
- ✅ **Invalid Response**: Data validation and error handling
- ✅ **Missing Images**: Placeholder image fallback
- ✅ **Cache Miss**: Direct API call when cache is empty

### Fallback Cities Data

The system includes a comprehensive fallback array with all 19 cities:

- Aix-en-Provence, Albufeira, Arles, Avignon, Biarritz
- Bilbao, Cádiz, Carcassonne, Coimbra, Faro
- Funchal, Girona, Lagos, Lourdes, Marseille
- Salamanca, San Sebastian, Santiago de Compostella, Toledo

## Performance Optimization

### Caching Strategy

```typescript
// Listing: global cache key + per-page/per-country keys (15-minute TTL)
const CACHE_TTL = 15 * 60 * 1000;
// See tour.actions.ts: cache, pageCache
// Tour detail: separate Map in tour-detail.actions.ts (same TTL order)
```

**Benefits**:

- ✅ Fewer Bokun round-trips for homepage pagination and repeat tour views
- ✅ Better TTFB for cached paths
- ✅ Lower rate-limit risk

### Image Optimization

- ✅ **Next.js Image Component**: Automatic optimization and lazy loading
- ✅ **Object Cover**: Proper image cropping with `object-cover` class
- ✅ **Responsive Images**: Automatic sizing for different screen sizes

## Security Considerations

### Server-Side Only

- ✅ **Bokun never in the browser**: All Bokun API calls happen server-side (server actions / RSC). Dev-only routes under `app/api/dev/` are unrelated to Bokun.
- ✅ **Credential Protection**: API keys never exposed to client
- ✅ **Server Actions**: Secure server-side execution only

### Authentication

- ✅ **HMAC-SHA1 Signature**: Proper Bokun API authentication
- ✅ **Environment Variables**: Secure credential management
- ✅ **Request Validation**: Input validation and sanitization

## Monitoring & Debugging

### Error Logging

```typescript
catch (error) {
  console.error("Error fetching products from Bokun API:", error);

  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error occurred"
  };
}
```

### Performance Metrics

- ✅ **Response Time Tracking**: Built-in timing for API calls
- ✅ **Cache Hit/Miss Tracking**: Cache performance monitoring
- ✅ **Error Rate Monitoring**: Comprehensive error tracking

## Configuration

### Environment Variables Required

```env
BOKUN_ACCESS_KEY=your_access_key_here
BOKUN_SECRET_KEY=your_secret_key_here
BOKUN_DOMAIN=your_domain_here
```

### Dependencies

- ✅ **Existing Bokun Utilities**: `lib/bokun/index.ts` & `lib/bokun/config.ts`
- ✅ **Next.js Server Actions**: Built-in server action support
- ✅ **TypeScript**: Full type safety throughout

## Usage Examples

### Basic Implementation

```typescript
// In a server component
import { getAllProducts } from "@/lib/actions/tour.actions";

const MyComponent = async () => {
  const result = await getAllProducts();

  if (result.success) {
    return <div>Found {result.data?.length} cities</div>;
  } else {
    return <div>Error: {result.error}</div>;
  }
};
```

### With Error Handling

```typescript
const result = await getAllProducts();
const cities = result.success && result.data ? result.data : FALLBACK_CITIES;

// Always renders, even if API fails
return <CityCard cities={cities} />;
```

## Future Enhancements

### Potential Improvements

- 🔄 **Redis Caching**: Replace in-memory cache with Redis for production scaling
- 🔄 **Real-time Updates**: WebSocket integration for live data updates
- ✅ **Country filter**: Implemented on landing (server-side via Bokun facetFilters); other filters (e.g. search) can be added similarly
- 🔄 **Analytics Integration**: Track city card interactions and performance
- 🔄 **A/B Testing**: Test different city card layouts and content

### Monitoring Additions

- 🔄 **Performance Metrics**: Track API response times and cache hit rates
- 🔄 **Error Alerting**: Set up alerts for API failures or high error rates
- 🔄 **Usage Analytics**: Monitor which cities are most popular

## Troubleshooting

### Common Issues

1. **API Timeout**: Check network connectivity and Bokun API status
2. **Authentication Errors**: Verify environment variables are set correctly
3. **Cache Issues**: Clear cache by restarting the application
4. **Image Loading**: Check if Bokun CDN images are accessible

### Debug Mode

Enable detailed logging by adding console.log statements in the server action for debugging API responses and cache behavior.

## Conclusion

This stack covers **listing** (homepage cities with pagination and country filter), **tour detail** (`/tours/[city]/[slug]` via `getTourDetailById`), and **Sanity city/country sync** on listing cache misses. Fallback cities on the homepage remain if listing fetch fails; tour pages use **404** / **error boundary** instead of silent success on failure.
