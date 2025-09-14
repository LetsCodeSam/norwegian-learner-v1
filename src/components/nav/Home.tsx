// Enhancements:
// - Category TABS (dynamic from top-level groups in navigation.json)
// - Search (handles æ/ø/å via normalizeForSearch)
// - CEFR Level filter (A1…C2 + Unknown) from dataset meta.cefr
// - Only datasets are clickable; groups are not
// - Dark-mode friendly, responsive

import { useEffect, useMemo, useState } from 'react';
import { loadNav } from './NavIndex';
import { fetchJSON } from '../../lib/fetchJSON';
import { normalizeForSearch } from '../../lib/lang';

type DatasetItem = {
  alias: string;
  label: string;
  emoji?: string;
  path: string;
  level?: string;     // meta.cefr from dataset file
  category: string;   // derived from top-level group label
};

// Traverse nav tree and collect datasets with a top-level category
function collectDatasetsWithCategory(node: any, depth = -1, currentCat = 'Misc'): DatasetItem[] {
  if (!node) return [];

  // If this is a group, decide whether it defines a top-level category
  if (node.type === 'group') {
    const nextCat = depth <= 0 ? (node.label || 'Misc') : currentCat;
    const kids: any[] = node.children || [];
    return kids.flatMap((c) => collectDatasetsWithCategory(c, depth + 1, nextCat));
  }

  // Dataset leaf
  if (node.type === 'dataset') {
    return [{
      alias: node.alias,
      label: node.label,
      emoji: node.emoji,
      path: node.path,
      category: currentCat || 'Misc',
    }];
  }

  // Root or unknown container
  const kids: any[] = node.children || node.tree || [];
  if (Array.isArray(kids)) {
    // If this node is the implicit "root", depth stays -1 so first groups count as top-level
    return kids.flatMap((c) => collectDatasetsWithCategory(c, depth + 1, currentCat));
  }

  return [];
}

export function Home({ onOpen }: { onOpen: (title: string, path: string) => void }) {
  const [nav, setNav] = useState<any>(null);
  const [items, setItems] = useState<DatasetItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [q, setQ] = useState('');
  const [level, setLevel] = useState<string>('All');
  const [cat, setCat] = useState<string>('All');

  // Load navigation
  useEffect(() => {
    loadNav().then(setNav).catch(console.error);
  }, []);

  // Flatten datasets with categories when nav arrives
  useEffect(() => {
    if (!nav) return;
    const root = nav.tree?.[0] || nav;
    const ds = collectDatasetsWithCategory(root);
    setItems(ds);
  }, [nav]);

  // Enrich items with level from each dataset JSON (meta.cefr)
  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    (async () => {
      setLoadingMeta(true);
      try {
        const enriched = await Promise.all(
          items.map(async (it) => {
            try {
              const data = await fetchJSON(it.path);
              const lvl = data?.meta?.cefr as string | undefined;
              return { ...it, level: lvl || it.level };
            } catch {
              return it;
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
  }, [items.length]);

  // Derive dynamic category list + counts
  const { categories, countsByCat } = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((i) => counts.set(i.category, (counts.get(i.category) || 0) + 1));
    const cats = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return { categories: ['All', ...cats], countsByCat: counts };
  }, [items]);

  // Derive dynamic level list
  const levels = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => s.add(i.level || 'Unknown'));
    return ['All', ...Array.from(s).filter(Boolean).sort()];
  }, [items]);

  // Filter by category + search + level
  const filtered = useMemo(() => {
    const nq = normalizeForSearch(q);
    return items.filter((it) => {
      const matchCat = cat === 'All' || it.category === cat;
      const matchQ =
        !nq ||
        normalizeForSearch(it.label).includes(nq) ||
        normalizeForSearch(it.path).includes(nq) ||
        normalizeForSearch(it.category).includes(nq);
      const lvl = it.level || 'Unknown';
      const matchL = level === 'All' || lvl === level;
      return matchCat && matchQ && matchL;
    });
  }, [items, q, level, cat]);

  return (
    <div className="max-w-5xl mx-auto p-3 pb-24 space-y-4">
      <h1 className="text-2xl font-semibold">Norsk Learner</h1>

      {/* Category Tabs */}
      <div className="sticky top-[64px] z-20 bg-gray-100 dark:bg-neutral-900 px-2 py-2 border-b border-gray-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((c) => {
              const active = c === cat;
              const count = c === 'All'
                ? items.length
                : (countsByCat.get(c) || 0);
              return (
                <button
                  key={c}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-shadow focus:outline-none focus:ring-2 whitespace-nowrap
                    ${active
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow'
                      : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:shadow'}`}
                  onClick={() => setCat(c)}
                >
                  {c} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
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
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            {levels.map((lv) => (
              <option key={lv} value={lv}>{lv}</option>
            ))}
          </select>
        </label>
        {loadingMeta && <span className="text-xs text-gray-500">loading levels…</span>}
      </div>

      {/* Grid */}
        <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <button
              key={item.alias}
              className="w-full max-w-full overflow-hidden rounded-2xl border border-gray-300 dark:border-neutral-700 shadow p-3 bg-white dark:bg-neutral-900 text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black"
              onClick={() => onOpen(item.label, item.path)}
              title={`${item.category} • ${item.path}`}
            >
              <div className="text-2xl mb-1">{item.emoji || '📘'}</div>
              <div className="font-medium break-words">{item.label}</div>
              <div className="text-xs text-gray-500 truncate">
                {item.category}{item.level ? ` • ${item.level}` : ''}
              </div>
            </button>
          ))}
        </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-sm text-gray-500">No lessons match your search/filter.</div>
      )}
    </div>
  );
}
