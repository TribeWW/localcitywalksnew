import { NextResponse } from "next/server";
import { createBokunUrl, generateBokunHeaders } from "@/lib/bokun";
type BokunSearchItem = {
  id: string;
  title: string;
};

type ResponseItem = {
  id: string;
  title: string;
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { items: ResponseItem[]; ts: number }>();
const PAGE_SIZE = 50;
const MAX_PAGES = 10; // max 500 items scanned; Studio UX
const MAX_MATCHES = 15;

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const q = (urlObj.searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const cacheKey = q.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ items: cached.items });
  }

  const url = createBokunUrl("/activity.json/search");
  const headers = generateBokunHeaders("POST", "/activity.json/search");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const qLower = q.toLowerCase();
    const matches: ResponseItem[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const body = {
        page,
        pageSize: PAGE_SIZE,
        sortField: "BEST_SELLING_GLOBAL",
      };

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        break;
      }

      const data = (await res.json()) as { items?: BokunSearchItem[] };
      const items = Array.isArray(data.items) ? data.items : [];

      for (const i of items) {
        if ((i.title ?? "").toLowerCase().includes(qLower)) {
          matches.push({
            id: String(i.id),
            title: i.title,
          });
          if (matches.length >= MAX_MATCHES) break;
        }
      }

      if (matches.length >= MAX_MATCHES) break;

      // Stop early if we reached the end of the catalog.
      if (items.length < PAGE_SIZE) break;
    }

    cache.set(cacheKey, { items: matches, ts: Date.now() });
    return NextResponse.json({ items: matches });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  } finally {
    clearTimeout(timeoutId);
  }
}

