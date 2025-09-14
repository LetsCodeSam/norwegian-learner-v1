// src/lib/fetchJSON.ts
const BUILD_TAG =
  (import.meta.env.VITE_BUILD_TAG as string) ||
  (typeof window !== 'undefined' ? String(Date.now()) : 'dev');

function resolveUrl(path: string): string {
  // allow "/data/foo.json" or "data/foo.json"
  const cleaned = String(path).replace(/^\.\//, '').replace(/^\/+/, ''); // strip leading "./" or "/"
  const base = import.meta.env.BASE_URL || '/';                          // e.g. "/norwegian-learner-v1/"
  const absBase = new URL(base, window.location.origin);                 // https://.../norwegian-learner-v1/
  const url = new URL(cleaned, absBase);                                 // https://.../norwegian-learner-v1/data/foo.json
  url.searchParams.set('v', BUILD_TAG);                                  // cache-bust per build
  return url.toString();
}

export async function fetchJSON(path: string) {
  const url = resolveUrl(path);
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}\n${text.slice(0, 200)}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(`Expected JSON, got ${ct} from ${url}\n${text.slice(0, 200)}`);
  return JSON.parse(text);
}
