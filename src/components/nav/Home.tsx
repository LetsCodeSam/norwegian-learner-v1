// File: src/components/nav/Home.tsx
// Home screen with dynamic categories discovered from navigation.json groups
// Features: search (æ/ø/å tolerant), level filter, dynamic category chips & grouped sections

import { useEffect, useMemo, useState } from 'react';
import { loadNav } from './NavIndex';
import { fetchJSON } from '../../lib/fetchJSON';
import { normalizeForSearch } from '../../lib/lang';

// ---- Types ----
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Unknown';

type DatasetItem = {
  alias: string;
  label: string;
  emoji?: string;
  path: string;
  level?: Level;        // from dataset meta.cefr or explicit in nav
  category?: string;    // label of the ancestor group (dynamic)
};

// ---- Helpers ----

// Walk the nav tree and collect datasets while carrying the nearest group label as 'category'.
function collectDatasets(node: any, currentCat?: string): DatasetItem[] {
  if (!node) return [];

  // If we hit a group, update the active category
  if (node.type === 'group') {
    const cat = node.label || currentCat || 'Other';
    const kids: any[] = node.children || [];
    return kids.flatMap((ch) => collectDatasets(ch, cat));
  }

  // If this is a dataset, capture it with the current category
  if (node.type === 'dataset') {
    const level: Level | undefined = (node.level as Level | undefined) || undefined;
    return [{
      alias: node.alias,
      label: node.label,
      emoji: node.emoji,
      path: node.path,
      level,
      category: currentCat || 'Other',
    }];
  }

  // Otherwise, descend
  const kids: any[] = node.children || [];
  return kids.flatMap((ch) => collectDatasets(ch, currentCat));
}

// Get the ordered list of top-level group labels under the Home route,
// so our chips/sections follow nav order (not alphabetical).
function getTopGroupOrder(homeNode: any): string[] {
  const groups = (homeNode?.children || []).filter((c: any) => c?.type === 'group');
  return groups.map((g: any) => g?.label).filter(Boolean);
}

// ---- Component ----
export function Home({ onOpen }: { onOpen: (title: string, path: string) => void }) {
  // data
  const [nav, setNav] = useState<any>(null);
  const [items, setItems] = useState<DatasetItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // filters
  const [q, setQ] = useState('');
  const [level, setLevel] = useState<'All' | Level>('All');
  const [cat, setCat] = useState<string>('All');

  // 1) Load navigation
  useEffect(() => {
    loadNav().then(setNav).catch(console.error);
  }, []);

  // 2) Flatten datasets + figure category order from nav
  const [catOrder, setCatOrder] = useState<string[]>([]);
  useEffect(() => {
    if (!nav) return;
    const root = nav.tree?.[0] || nav; // route 'Home'
    // Collect datasets with categories
    const ds = collectDatasets(root);
    setItems(ds);
    // Record the top-level group order (chips/sections follow this)
    setCatOrder(getTopGroupOrder(root));
  }, [nav]);

  // 3) Enrich with meta.cefr — run once per dataset list (tracked by stable key of paths)
  const pathsKey = useMemo(() => items.map((i) => i.path).join('|'), [items]);
  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const enriched = await Promise.all(
          items.map(async (it) => {
            // keep explicit level from nav if present
            if (it.level && it.level !== 'Unknown') return it;
            try {
              const data = await fetchJSON(it.path);
              const raw = (data?.meta?.cefr as string | undefined) || undefined;
              const lvl: Level | undefined =
                raw && ['A1','A2','B1','B2','C1','C2'].includes(raw) ? (raw as Level)
                : raw ? 'Unknown'
                : undefined;
              return { ...it, level: lvl ?? it.level };
            } catch {
              return it; // keep as-is if fetch fails
            }
          })
        );
        if (!cancelled) setItems(enriched);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathsKey]);

  // 4) Build dynamic categories list: ["All", ...top-level groups from nav, ...any extra from data]
  const categories = useMemo(() => {
    const fromData = Array.from(new Set(items.map(i => i.category).filter(Boolean) as string[]));
    // merge keeping nav order first, then any unlisted extras
    const ordered = [...catOrder, ...fromData.filter(c => !catOrder.includes(c))];
    return ['All', ...ordered];
  }, [items, catOrder]);

  // 5) Apply search + level filters
  const searchFiltered = useMemo(() => {
    const nq = normalizeForSearch(q);
    return items.filter((it) => {
      const matchQ =
        !nq ||
        normalizeForSearch(it.label).includes(nq) ||
        normalizeForSearch(it.path).includes(nq);
      const lvl = (it.level || 'Unknown') as Level;
      const matchL = level === 'All' || lvl === level;
      return matchQ && matchL;
    });
  }, [items, q, level]);

  // 6) Category filter
  const catFiltered = useMemo(() => {
    if (cat === 'All') return searchFiltered;
    return searchFiltered.filter((it) => (it.category || 'Other') === cat);
  }, [searchFiltered, cat]);

  // 7) Group by category for rendering (preserve category order)
  const groups = useMemo(() => {
    const m = new Map<string, DatasetItem[]>();
    for (const c of categories) if (c !== 'All') m.set(c, []);
    for (const it of catFiltered) {
      const key = it.category || 'Other';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(it);
    }
    return m;
  }, [catFiltered, categories]);

  // UI helpers
  const Chip = ({ value }: { value: string }) => {
    const active = cat === value;
    return (
      <button
        onClick={() => setCat(value)}
        className={`px-3 py-1 rounded-full border text-sm transition-shadow
          ${active
            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow'
            : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:shadow'}`}
      >
        {value}
      </button>
    );
  };

  const Section = ({ title, items }: { title: string; items: DatasetItem[] }) =>
    items.length ? (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {title} <span className="ml-1 text-xs text-gray-500">({items.length})</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <button
              key={item.alias}
              className="rounded-2xl border border-gray-300 dark:border-neutral-700 shadow p-3 bg-white dark:bg-neutral-900 text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black"
              onClick={() => onOpen(item.label, item.path)}
              title={item.label}
            >
              <div className="text-2xl mb-1">{item.emoji || '📘'}</div>
              <div className="font-medium">{item.label}</div>
              <div className="text-xs text-gray-500">{item.level || 'Unknown'}</div>
            </button>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div className="max-w-4xl mx-auto p-3 pb-24 space-y-4">
      <h1 className="text-2xl font-semibold">Norsk Learner</h1>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons… (supports æ/ø/å)"
          className="flex-1 min-w-[12rem] rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <label className="text-sm font-medium text-gray-800 dark:text-gray-200 inline-flex items-center gap-2">
          Level
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className="rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {(['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Unknown'] as const).map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Category Chips (dynamic) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Categories</span>
        {categories.map((c) => (
          <Chip key={c} value={c} />
        ))}
        {loadingMeta && <span className="text-xs text-gray-500">loading levels…</span>}
      </div>

      {/* Grouped Sections in nav order */}
      {[...groups.entries()].map(([title, list]) => (
        <Section key={title} title={title} items={list} />
      ))}

      {/* Empty state */}
      {catFiltered.length === 0 && (
        <div className="text-sm text-gray-500">No lessons match your filters.</div>
      )}
    </div>
  );
}

export default Home;
