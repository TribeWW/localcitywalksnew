# Bokun API Configuration

This document describes the Bokun API integration setup for the LocalCityWalks application.

## Overview

The application integrates with Bokun's booking API to fetch tour data and handle bookings. The integration is built with a clean, modular architecture that separates configuration, authentication, and API utilities.

## File Structure

```
lib/
  bokun/
    config.ts          # Configuration and API endpoints
    index.ts           # Core utility functions
app/
  api/
    tours/
      route.ts         # API endpoint for fetching tours
```

## Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
BOKUN_ACCESS_KEY=your_access_key_here
BOKUN_SECRET_KEY=your_secret_key_here
BOKUN_DOMAIN=your_domain_here
```

### Configuration File (`lib/bokun/config.ts`)

The configuration file exports:

- `BokunConfig` interface for type safety
- `bokunConfig` object with environment-based configuration
- `BOKUN_ENDPOINTS` constant with API endpoint definitions

## Core Utilities (`lib/bokun/index.ts`)

### Functions

#### `generateSignature(date, method, path, secretKey, accessKey)`

- Generates HMAC-SHA1 signature for Bokun API authentication
- Handles proper path encoding
- Returns Base64 encoded signature

#### `generateBokunHeaders(method, path)`

- Creates standardized headers for Bokun API requests
- Includes: `X-Bokun-Date`, `X-Bokun-AccessKey`, `X-Bokun-Signature`, `Content-Type`
- Returns `HeadersInit` object

#### `createBokunUrl(path, queryParams?)`

- Creates fully qualified Bokun API URLs
- Handles query parameter encoding
- Returns complete URL string

## API Endpoints

### Available Endpoints

- `SEARCH`: `/activity.json/search` - Search for tours
- `PRODUCT_BY_ID`: `/activity.json/{id}` - Get tour by ID
- `PRODUCT_BY_SLUG`: `/activity.json/slug/{slug}` - Get tour by slug
- `PICKUP_PLACES`: `/activity.json/{id}/pickup-places` - Get pickup locations

### Search: pagination and filtering

The search endpoint supports **pagination** (`page`, `pageSize`) and optional **facetFilters** to restrict results (e.g. by country). The landing-page tours section uses this to load 20 items per page and to filter by country on the server. Cache keys should include filter state when applicable.

### Tour page URL scheme (`/tours/{city}/{slug}`)

Used for the city-first tour page. The **slug** is generated from search data (Bokun does not return a slug in search):

- **{city}**: Slugified `googlePlace.city` (e.g. `Toledo` → `toledo`, `Aix-en-Provence` → `aix-en-provence`). Lowercase, spaces to hyphens.
- **{slug}**: **Slugified product title + "-" + product id** for readability and uniqueness (e.g. `hello-toledo-private-walk-1077682`). When handling a request, parse the id from the end of the slug and fetch detail via `GET /activity.json/{id}`.

Example: `/tours/toledo/hello-toledo-private-walk-1077682`. See `documentation/investigation/bokun-search-payload-and-url-scheme.md` for full search payload and decisions.

### Routing contract (city validation)

The **`{city}`** segment is **validated** against the product’s city from the detail response. After fetching by id, the app compares `params.city` with the slugified **`googlePlace.city`** from Bokun (the canonical city). If they **match** → render the tour page. If they **do not match** → **redirect** to the canonical URL `/tours/{canonicalCity}/{slug}` (e.g. `/tours/madrid/hello-toledo-1077682` → redirect to `/tours/toledo/hello-toledo-1077682`). If the product is **not found** (e.g. Bokun returns 404) → show **404**, no redirect. This keeps one canonical URL per tour and ensures the city in the URL always reflects the tour’s actual city.

### Single-product fetch (tour detail)

The tour page fetches full detail via **`GET /activity.json/{id}`** (`BOKUN_ENDPOINTS.PRODUCT_BY_ID`). The app resolves the product **id** from the URL slug (trailing segment after the last `-`); we do not use Bokun’s slug endpoint for this flow. Implementation: `lib/actions/tour-detail.actions.ts` (`getTourDetailById`).

### Image domains (Next.js)

Tour and listing images use Bokun’s **derived** URLs (`keyPhoto.derived`, `photos[].derived`), which are served from **imgcdn.bokun.tools**. The **original** image URLs may use **bokun.s3.amazonaws.com**. Both hosts are allowlisted in `next.config.ts` `images.remotePatterns` so `next/image` works for search and tour detail.

### Example Usage

```typescript
import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";

// Create URL
const url = createBokunUrl("/activity.json/search");

// Generate headers
const headers = generateBokunHeaders("POST", "/activity.json/search");

// Make request
const response = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify({}),
});
```

## API Route Example

The application includes a simple API route at `/api/tours` that demonstrates the integration:

```typescript
// app/api/tours/route.ts
export async function GET() {
  const url = createBokunUrl("/activity.json/search");
  const headers = generateBokunHeaders("POST", "/activity.json/search");

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  return NextResponse.json(await response.json());
}
```

## Authentication

Bokun uses HMAC-SHA1 signature authentication with the following process:

1. Create timestamp in UTC format: `yyyy-MM-dd HH:mm:ss`
2. Concatenate: `date + accessKey + method + path`
3. Generate HMAC-SHA1 signature using secret key
4. Base64 encode the signature
5. Include in `X-Bokun-Signature` header

## Error Handling

The integration includes basic error handling:

- API request failures return 500 status
- Missing environment variables throw descriptive errors
- Network errors are caught and handled gracefully

## Testing

To test the integration:

1. Ensure environment variables are set
2. Start the development server: `npm run dev`
3. Visit: `http://localhost:3000/api/tours`
4. Check browser network tab for API calls

## Security Notes

- API keys are stored in environment variables
- Never commit `.env.local` to version control
- Use different keys for development and production
- Rotate keys regularly for security

## Future Enhancements

- Add request caching for better performance
- Implement retry logic for failed requests
- Add comprehensive error logging
- Support for additional Bokun API endpoints
- Rate limiting and request throttling
