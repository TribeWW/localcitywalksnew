import { NextResponse } from "next/server";

/**
 * Controls access to design/dev preview routes under `/preview` based on environment.
 *
 * Allows the request to proceed when `ALLOW_PREVIEW_ROUTES` is set to `"true"` or when
 * `VERCEL_ENV` is not `"production"`; otherwise responds with HTTP 404.
 *
 * @returns A NextResponse that continues the request when preview routes are allowed, or a 404 response when they are not.
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
