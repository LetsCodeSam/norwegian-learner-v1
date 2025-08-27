// File: src/lib/fetchJSON.ts
// Some environments (older Vite configs or SSR) may have BASE_URL as a plain string
// not valid for URL(base). Use string concat with a safe join instead of new URL().

function joinBase(base: string, rel: string) {
  // ensure exactly one slash between base and rel
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const r = rel.startsWith('/') ? rel : `/${rel}`;
  return `${b}${r}`;
}

export async function fetchJSON(path: string) {
  const rel = path.startsWith('/') ? path.slice(1) : path.replace(/^\.\/?/, '');
  const base = (import.meta as any).env?.BASE_URL || '/';
  const url = joinBase(String(base), rel);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

/*
Notes:
- Keep JSON entries using absolute paths like "/data/describe/mai.json".
- With vite.config.ts base: '/norwegian-learner-v1/', this will fetch
  '/norwegian-learner-v1/data/...' in dev and prod.
*/