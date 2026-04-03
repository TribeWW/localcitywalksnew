import { NextResponse } from "next/server";

/**
 * Controls access to design/dev preview routes under `/preview` based on environment variables.
 *
 * Allows requests when `ALLOW_PREVIEW_ROUTES` is `"true"` or when `VERCEL_ENV` is not `"production"`.
 * When previews are not allowed, responds with HTTP 404 and no body.
 *
 * @returns `NextResponse.next()` if preview routes are permitted, otherwise a `NextResponse` with status 404.
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
