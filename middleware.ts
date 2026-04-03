import { NextResponse } from "next/server";

/**
 * Design/dev preview routes under `/preview` are not served on Vercel production.
 * Preview deployments (VERCEL_ENV=preview) and local dev remain available.
 * Set ALLOW_PREVIEW_ROUTES=true only if you intentionally need these URLs in production.
 */
export function middleware() {
  const allow =
    process.env.ALLOW_PREVIEW_ROUTES === "true" ||
    process.env.VERCEL_ENV !== "production";

  if (allow) {
    return NextResponse.next();
  }

  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: "/preview/:path*",
};
