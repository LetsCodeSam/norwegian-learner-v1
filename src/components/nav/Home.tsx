// File: src/components/nav/Home.tsx
// This version keeps your behavior but adds a couple of safety tweaks:
// - Safer meta-enrichment effect that runs once per dataset list (won't re-loop)
// - Level type alias + stable level ordering (Unknown last)
// - Minor a11y labels

import { useEffect, useMemo, useState } from 'react';
import { loadNav } from './NavIndex';
import { fetchJSON } from '../../lib/fetchJSON';
import { normalizeForSearch } from '../../lib/lang';


type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Unknown';

type DatasetItem = {
  alias: string;
  label: string;
  emoji?: string;
  path: string;
  level?: Level; // meta.cefr from dataset file
};

function collectDatasets(node: any): DatasetItem[] {
  if (!node) return [];
  if (node.type === 'dataset') {
    return [{ alias: node.alias, label: node.label, emoji: node.emoji, path: node.path }];
  }
  const kids: any[] = node.children || [];
  return kids.flatMap(collectDatasets);
}

export function Home({ onOpen }: { onOpen: (title: string, path: string) => void }) {
  const [nav, setNav] = useState<any>(null);
  const [items, setItems] = useState<DatasetItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [q, setQ] = useState('');
  const [level, setLevel] = useState<'All' | Level>('All');

  // 1) Load navigation
  useEffect(() => {
    loadNav().then(setNav).catch(console.error);
  }, []);

  // 2) Flatten datasets when nav arrives
  useEffect(() => {
    if (!nav) return;
    const root = nav.tree?.[0] || nav;
    setItems(collectDatasets(root));
  }, [nav]);

  // 3) Enrich with meta.cefr — run once per dataset list (tracked by stable key of paths)
  const pathsKey = useMemo(() => items.map(i => i.path).join('|'), [items]);
  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const enriched = await Promise.all(items.map(async (it) => {
          try {
            const data = await fetchJSON(it.path);
            const raw = (data?.meta?.cefr as string | undefined) || undefined;
            const lvl: Level | undefined = raw && ['A1','A2','B1','B2','C1','C2'].includes(raw) ? (raw as Level) : raw ? 'Unknown' : undefined;
            return { ...it, level: lvl ?? it.level };
          } catch {
            return it;
          }
        }));
        if (!cancelled) setItems(enriched);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathsKey]);

  const levelsPresent = useMemo(() => {
    const s = new Set<Level>();
    items.forEach((i) => s.add((i.level || 'Unknown') as Level));
    const arr = Array.from(s);
    // keep a stable order and put Unknown at the end
    const order: Level[] = ['A1','A2','B1','B2','C1','C2'];
    const known = order.filter(l => arr.includes(l));
    const unknown = arr.includes('Unknown') ? ['Unknown'] as const : [];
    return ['All', ...known, ...unknown] as const;
  }, [items]);

  const filtered = useMemo(() => {
    const nq = normalizeForSearch(q);
    return items.filter((it) => {
      const matchQ = !nq || normalizeForSearch(it.label).includes(nq) || normalizeForSearch(it.path).includes(nq);
      const lvl = (it.level || 'Unknown') as Level;
      const matchL = level === 'All' || lvl === level;
      return matchQ && matchL;
    });
  }, [items, q, level]);

  return (
    <div className="max-w-4xl mx-auto p-3 pb-24 space-y-4">
      <h1 className="text-2xl font-semibold">Norsk Learner</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="home-search">Search</label>
        <input
          id="home-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons… (supports æ/ø/å)"
          className="flex-1 min-w-[12rem] rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <label className="text-sm font-medium text-gray-800 dark:text-gray-200 inline-flex items-center gap-2" htmlFor="home-level">
          Level
          <select
            id="home-level"
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className="rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {levelsPresent.map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
        </label>
        {loadingMeta && <span className="text-xs text-gray-500">loading levels…</span>}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((item) => (
          <button
            key={item.alias}
            className="rounded-2xl border border-gray-300 dark:border-neutral-700 shadow p-3 bg-white dark:bg-neutral-900 text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black"
            onClick={() => onOpen(item.label, item.path)}
            title={item.label} // was item.path
        >

            <div className="text-2xl mb-1">{item.emoji || '📘'}</div>
            <div className="font-medium">{item.label}</div>
            <div className="text-xs text-gray-500">{item.level || 'Unknown'}</div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-gray-500">No lessons match your search/filter.</div>
      )}
    </div>
  );
}




/*// Replace the entire file: src/components/nav/Home.tsx
// Fixes these TS errors:
// - TS2686: 'React' refers to a UMD global → add proper imports and stop using React.useState/React.useEffect
// - TS2304: Cannot find name 'loadNav' → import it from NavIndex

import { useEffect, useState } from 'react';
import { loadNav } from './NavIndex';

export function Home({ onOpen }: { onOpen: (title: string, path: string) => void }) {
  const [nav, setNav] = useState<any>(null);

  useEffect(() => {
    loadNav().then(setNav).catch(console.error);
  }, []);

  const groups = nav?.tree?.[0]?.children || [];

  return (
    <div className="max-w-4xl mx-auto p-3 pb-24 space-y-4">
      <h1 className="text-2xl font-semibold">Norsk Learner</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {groups.flatMap((g: any) => (g.children || []).map((item: any) => (
          <button
            key={item.alias}
            className="rounded-2xl border shadow p-3 bg-white text-left"
            onClick={() => onOpen(item.label, item.path)}
          >
            <div className="text-2xl">{item.emoji || '📘'}</div>
            <div className="font-medium">{item.label}</div>
            <div className="text-xs text-gray-500 truncate">{item.path}</div>
          </button>
        )))}
      </div>
    </div>
  );
}

/*
Notes:
- Keep App.tsx importing as a NAMED export:
    import { Home } from './components/nav/Home';
- Ensure src/components/nav/NavIndex.ts exports loadNav like this:
    import { fetchJSON } from '../../lib/fetchJSON';
    export async function loadNav(navPath = '/data/navigation.json') { return fetchJSON(navPath); }
- Make sure tsconfig.json has the automatic JSX runtime to avoid needing a default React import:
    {
      "compilerOptions": { "jsx": "react-jsx" }
    }
*/
