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
