// src/App.tsx
import { useEffect, useState } from 'react';
import { AudioProvider } from './components/audio/AudioProvider';
import { MiniPlayer } from './components/audio/MiniPlayer';
import { Home } from './components/nav/Home';
import { LessonPage } from './components/lesson/LessonPage';
import { ThemeProvider } from './components/theme/ThemeProvider';
import ThemeToggle from './components/theme/ThemeToggle';
import { replaceRoute } from './lib/hashRouter';

/** ----------------- Minimal hash router (GitHub Pages friendly) ----------------- */
type Route =
  | { view: 'home' }
  | { view: 'lesson'; title?: string; path: string };

const BASE = (import.meta as any).env?.BASE_URL || '/';

function buildHomeURL() {
  return `${BASE.replace(/\/$/, '')}#/home`;
}
function buildLessonURL(path: string, title?: string) {
  const qs = new URLSearchParams({ p: path, ...(title ? { t: title } : {}) });
  return `${BASE.replace(/\/$/, '')}#/lesson?${qs}`;
}
function parseRoute(): Route {
  const raw = location.hash || '#/home';
  const [route, query] = raw.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query || '');
  if (route.startsWith('/lesson')) {
    return { view: 'lesson', path: params.get('p') || '', title: params.get('t') || undefined };
  }
  return { view: 'home' };
}
function pushRoute(r: Route) {
  const url = r.view === 'home' ? buildHomeURL() : buildLessonURL(r.path, r.title);
  history.pushState(null, '', url);
  // ensure listeners fire even if hash string is identical
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const nav = (r: Route) => pushRoute(r);
  return [route, nav] as const;
}
/** ------------------------------------------------------------------------------ */

export default function App() {
  const [route, nav] = useHashRoute();

  // Ensure a route exists on direct visit
  useEffect(() => {
    if (!location.hash) history.replaceState(null, '', buildHomeURL());
  }, []);

  // Nice page titles
  useEffect(() => {
    if (route.view === 'home') document.title = 'Norsk Learner';
    else document.title = `${route.title || 'Lesson'} • Norsk Learner`;
  }, [route]);

  const isLesson = route.view === 'lesson';

  return (
    <ThemeProvider>
      <AudioProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 dark:text-gray-100">
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-gray-200 dark:border-neutral-800">
            <div className="max-w-4xl mx-auto flex items-center gap-2 px-3 py-2">
              {isLesson ? (
                <button
                  className="px-2 py-1 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  onClick={() => replaceRoute({ view: 'home' })}
                  //onClick={() => nav({ view: 'home' })}
                  title="Back"
                >
                  ← Back
                </button>
              ) : (
                <button
                  className="px-2 py-1 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  onClick={() => nav({ view: 'home' })}
                  title="Home"
                >
                  🏠 Home
                </button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {route.view === 'home' && (
            <Home onOpen={(title, path) => nav({ view: 'lesson', title, path })} />
          )}

          {route.view === 'lesson' && (
            <LessonPage title={route.title ?? 'Lesson'} path={route.path} />
          )}

          <MiniPlayer />
        </div>
      </AudioProvider>
    </ThemeProvider>
  );
}
