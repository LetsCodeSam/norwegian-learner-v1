// File: src/components/nav/Home.tsx
// Home screen grouped by Category (Listening / Describe / Conversation)
// Includes: search (æ/ø/å tolerant), level filter, category chips, and grouped sections

import { useEffect, useMemo, useState } from 'react';
import { loadNav } from './NavIndex';
import { fetchJSON } from '../../lib/fetchJSON';
import { normalizeForSearch } from '../../lib/lang';

// ---- Types ----
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Unknown';
export type Category = 'listening' | 'describe' | 'conversation' | 'other';

type DatasetItem = {
  alias: string;
  label: string;
  emoji?: string;
  path: string;
  level?: Level; // meta.cefr from dataset file or explicit in nav (optional)
};

// ---- Helpers ----
function collectDatasets(node: any): DatasetItem[] {
  if (!node) return [];
  if (node.type === 'dataset') {
    const level: Level | undefined = (node.level as Level | undefined) || undefined;
    return [{ alias: node.alias, label: node.label, emoji: node.emoji, path: node.path, level }];
  }
  const kids: any[] = node.children || [];
  return kids.flatMap(collectDatasets);
}

function getCategoryFromPath(path: string): Category {
  const m = path.match(/^\/(?:norwegian-learner-v1\/)?data\/(listening|describe|conversation)\//i);
  return (m?.[1]?.toLowerCase() as Category) || 'other';
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
  const [cat, setCat] = useState<'all' | Category>('all');

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
              const lvl: Level | undefined = raw && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(raw)
                ? (raw as Level)
                : raw
                ? 'Unknown'
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathsKey]);

  // 4) Apply search + level filters
  const filtered = useMemo(() => {
    const nq = normalizeForSearch(q);
    return items.filter((it) => {
      const matchQ = !nq ||
        normalizeForSearch(it.label).includes(nq) ||
        normalizeForSearch(it.path).includes(nq);
      const lvl = (it.level || 'Unknown') as Level;
      const matchL = level === 'All' || lvl === level;
      return matchQ && matchL;
    });
  }, [items, q, level]);

  // 5) Category filter
  const catFiltered = useMemo(() => {
    if (cat === 'all') return filtered;
    return filtered.filter((it) => getCategoryFromPath(it.path) === cat);
  }, [filtered, cat]);

  // 6) Group by category for rendering
  const groups = useMemo(() => {
    const map: Record<Category, DatasetItem[]> = {
      listening: [],
      describe: [],
      conversation: [],
      other: [],
    };
    for (const it of catFiltered) {
      map[getCategoryFromPath(it.path)].push(it);
    }
    return map;
  }, [catFiltered]);

  // UI helpers
  const Chip = ({ value, label }: { value: 'all' | Category; label: string }) => (
    <button
      onClick={() => setCat(value)}
      className={`px-3 py-1 rounded-full border text-sm transition-shadow
        ${cat === value
          ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow'
          : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:shadow'}`}
    >
      {label}
    </button>
  );

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
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Categories</span>
        <Chip value="all" label="All" />
        <Chip value="listening" label="Listening" />
        <Chip value="describe" label="Describe" />
        <Chip value="conversation" label="Conversation" />
        {loadingMeta && <span className="text-xs text-gray-500">loading levels…</span>}
      </div>

      {/* Grouped Sections */}
      <Section title="Listening" items={groups.listening} />
      <Section title="Describe" items={groups.describe} />
      <Section title="Conversation" items={groups.conversation} />
      <Section title="Other" items={groups.other} />

      {/* Empty state */}
      {catFiltered.length === 0 && (
        <div className="text-sm text-gray-500">No lessons match your filters.</div>
      )}
    </div>
  );
}
