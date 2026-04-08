import { NextResponse } from "next/server";
import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";

type BokunProductDetail = {
  id: string;
  title: string;
};

type ResponseItem = {
  id: string;
  title: string;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { item: ResponseItem; ts: number }>();

/**
 * Fetches a Bokun activity by the `id` query parameter, normalizes it to `{ id: string, title: string }`, and caches successful results for 60 seconds.
 *
 * Uses an in-memory cache keyed by `id`. If `id` is missing, the upstream response is non-OK, the response body is invalid, or the upstream request fails or times out, the handler returns `item: null`.
 *
 * @returns A NextResponse whose JSON body is `{ item: ResponseItem | null }` and HTTP status 200; `item` contains the normalized product on success or `null` otherwise.
 */
export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const id = (urlObj.searchParams.get("id") ?? "").trim();

  if (!id) {
    return NextResponse.json({ item: null }, { status: 200 });
  }

  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ item: cached.item }, { status: 200 });
  }

  const path = `/activity.json/${encodeURIComponent(id)}`;
  const url = createBokunUrl(path);
  const headers = generateBokunHeaders("GET", path);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
    if (!res.ok) return NextResponse.json({ item: null }, { status: 200 });
    const data = (await res.json()) as BokunProductDetail;
    if (!data?.id || !data?.title) return NextResponse.json({ item: null }, { status: 200 });

    const item: ResponseItem = {
      id: String(data.id),
      title: data.title,
    };
    cache.set(id, { item, ts: Date.now() });
    return NextResponse.json({ item }, { status: 200 });
  } catch {
    return NextResponse.json({ item: null }, { status: 200 });
  } finally {
    clearTimeout(timeoutId);
  }
}

