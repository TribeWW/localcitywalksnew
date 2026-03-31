# Bokun API Configuration

This document describes the Bokun API integration setup for the LocalCityWalks application.

## Overview

The application integrates with Bokun's booking API to fetch tour data and handle bookings. The integration is built with a clean, modular architecture that separates configuration, authentication, and API utilities.

## File Structure

```
lib/
  bokun/
    config.ts                 # Configuration and API endpoints
    index.ts                  # createBokunUrl, generateBokunHeaders, etc.
  actions/
    tour.actions.ts           # Search / listing (getProductsPage, getAllProducts)
    tour-detail.actions.ts    # Single product by id (getTourDetailById)
app/
  tours/[city]/[slug]/
    page.tsx                  # City-first tour detail (server)
    loading.tsx
    not-found.tsx
    error.tsx                 # Error UI when detail fetch fails (non-404)
  api/
    dev/                      # Dev-only utilities (e.g. delete-all-cities)
```

There is **no** public `/api/tours` route in this repo; Bokun is called only from **server actions** and server components.

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

- **Caching**: Successful responses are cached in memory for **15 minutes** (same TTL order of magnitude as product search in `tour.actions.ts`).
- **Timeouts / errors**: Non-404 failures are logged with `console.error` on the server; the tour route surfaces them via **`error.tsx`** (see below)—not as a “soft” 200 page.

### Tour page: HTML description safety

Rich text from Bokun (`description` / `summary`) is rendered with `dangerouslySetInnerHTML` only after sanitization. The app uses **`sanitize-html`** on the server (no **jsdom** / no **`isomorphic-dompurify`** in this path). The latter pulls in jsdom and can break **Next.js / Vercel** builds (`default-stylesheet.css` ENOENT) when bundled for the server.

### Tour page: errors vs 404

- **`Tour not found`** (Bokun 404 / missing product) → `notFound()` → **`not-found.tsx`** (404).
- **Any other failed `getTourDetailById` result** (timeout, 5xx, invalid payload) → **`throw new Error(...)`** → segment **`error.tsx`** (error status + retry / contact UI).

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

## Calling Bokun from application code

Use **`createBokunUrl`** + **`generateBokunHeaders`** from `@/lib/bokun` inside **server actions** or **server components**. Do not expose access/secret keys to the client.

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

1. Set Bokun env vars in `.env.local`.
2. Run `npm run dev`.
3. Open the homepage **cities** section (search action) or a tour URL `/tours/{city}/{slug}` (detail action).
4. Inspect **server logs** for Bokun errors; use **Network** only for client-visible requests (Bokun calls themselves are server-side).

## Security Notes

- API keys are stored in environment variables
- Never commit `.env.local` to version control
- Use different keys for development and production
- Rotate keys regularly for security

## Future Enhancements

- Optional **retry** with backoff for transient Bokun failures (today: timeout + single attempt).
- Structured **observability** (e.g. APM) beyond `console.error` if traffic or SLOs require it.
- Additional Bokun endpoints if product needs grow.
- Rate limiting / throttling at the edge if abuse becomes a concern.
