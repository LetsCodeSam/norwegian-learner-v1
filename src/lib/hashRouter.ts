// src/lib/hashRouter.ts
import { useEffect, useState } from 'react';

export type Route =
  | { view: 'home' }
  | { view: 'lesson'; path: string; title?: string };

// src/lib/hashRouter.ts
const RAW_BASE = (import.meta as any).env?.BASE_URL || '/';
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : RAW_BASE + '/';

export function buildHomeURL(): string {
  return `${BASE}#/home`;
}

export function buildLessonURL(path: string, title?: string): string {
  const qs = new URLSearchParams({ p: path, ...(title ? { t: title } : {}) });
  return `${BASE}#/lesson?${qs}`;
}


export function parseRoute(): Route {
  const raw = location.hash || '#/home';
  const [route, query] = raw.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query || '');
  if (route.startsWith('/lesson')) {
    return {
      view: 'lesson',
      path: params.get('p') || '',
      title: params.get('t') || undefined,
    };
  }
  return { view: 'home' };
}

export function pushRoute(r: Route): void {
  const url = r.view === 'home' ? buildHomeURL() : buildLessonURL(r.path, r.title);
  history.pushState(null, '', url);
  // fire listeners even if hash string ends up identical
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useHashRouter() {
  const [route, setRoute] = useState<Route>(() => parseRoute());

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const nav = (r: Route) => pushRoute(r);
  return [route, nav] as const;
}

// in lib/hashRouter.ts
export function replaceRoute(r: Route) {
  const url = r.view === 'home' ? buildHomeURL() : buildLessonURL(r.path, r.title);
  history.replaceState(null, '', url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

