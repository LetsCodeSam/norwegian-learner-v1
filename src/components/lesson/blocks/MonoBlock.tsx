// Monolog with grouped subsections, optional VIDEO per subsection,
// and aspect-ratio support.

// Accepts:
//   groups: [{ title, items? | model?, video|src|url?, aspect? }, ...]
//   aspect: "16:9" | "4:3" | "1:1" | number(percentage) | omitted (defaults 16:9)

import React from 'react';
import { AudioCtx } from '../../audio/AudioProvider';
import { ClickableText } from '../../common/ClickableText';

type MonoLine = { no: string; pron?: string; en?: string };

type LinesPer = 1 | 5 | 10 | 'All';
const LINES_PER_OPTIONS: LinesPer[] = [1, 5, 10, 'All'];

type MonoGroup = {
  title: string;
  items: MonoLine[];
  videoSrc?: string;   // http(s) embed URL
  aspectPct?: string;  // CSS padding-top (e.g. '56.25%')
};

// -------- helpers --------
function toLines(maybe: any): MonoLine[] {
  if (!maybe) return [];
  if (Array.isArray(maybe)) {
    const out: MonoLine[] = [];
    for (const x of maybe) {
      if (x && Array.isArray((x as any).model)) {
        out.push(...toLines((x as any).model));
        continue;
      }
      if (typeof x === 'string') out.push({ no: x });
      else if (x && typeof x === 'object' && typeof (x as any).no === 'string') {
        const o = x as any;
        out.push({ no: o.no, pron: o.pron, en: o.en });
      }
    }
    return out;
  }
  if (Array.isArray(maybe.items)) return toLines(maybe.items);
  if (Array.isArray(maybe.model)) return toLines(maybe.model);
  if (Array.isArray(maybe.paragraphs)) return toLines(maybe.paragraphs);
  if (Array.isArray(maybe.text)) return toLines(maybe.text);
  if (typeof maybe === 'object' && typeof (maybe as any).no === 'string') {
    const o = maybe as any;
    return [{ no: o.no, pron: o.pron, en: o.en }];
  }
  return [];
}

function getVideoSrc(obj: any): string | undefined {
  if (!obj) return undefined;
  const byKey = obj.video ?? obj.src ?? obj.url;
  if (typeof byKey === 'string') return byKey;
  if (obj.type === 'video' && typeof obj.src === 'string') return obj.src;
  return undefined;
}

function safeVideoSrc(url?: string): string | undefined {
  if (!url) return;
  try {
    const u = new URL(url, window.location.origin);
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString();
  } catch {}
  return;
}

function parseAspectToPaddingTop(aspect: any): string {
  // "16:9" / "4:3" / "1:1"
  if (typeof aspect === 'string') {
    const m = aspect.match(/^(\d+(?:\.\d+)?)[\s:\/]+(\d+(?:\.\d+)?)$/);
    if (m) {
      const w = parseFloat(m[1]), h = parseFloat(m[2]);
      if (w > 0 && h > 0) return `${(h / w) * 100}%`;
    }
    const n = Number(aspect);
    if (!Number.isNaN(n) && n > 0) return `${n}%`;
  }
  if (typeof aspect === 'number' && isFinite(aspect) && aspect > 0) return `${aspect}%`;
  return '56.25%'; // default 16:9
}

function extractGroups(block: any): MonoGroup[] {
  if (Array.isArray(block?.groups) && block.groups.length) {
    return block.groups.map((g: any, i: number) => ({
      title: g?.title || `Section ${i + 1}`,
      items: toLines(g),
      videoSrc: safeVideoSrc(getVideoSrc(g)),
      aspectPct: parseAspectToPaddingTop(g?.aspect),
    }));
  }
  // fallback single group; also allow top-level video/aspect
  return [{
    title: block?.title || 'Monolog',
    items: toLines(block),
    videoSrc: safeVideoSrc(getVideoSrc(block)),
    aspectPct: parseAspectToPaddingTop(block?.aspect),
  }];
}

// -------- component --------
export default function MonoBlock({ block }: { block: any }) {
  const { state, speakNow, queuePlay } = React.useContext(AudioCtx);
  const groups = React.useMemo(() => extractGroups(block), [block]);

  const [active, setActive] = React.useState(0);
  const [linesPerByIdx, setLP] = React.useState<LinesPer[]>(() => groups.map(() => 'All'));
  const [startByIdx, setStart] = React.useState<number[]>(() => groups.map(() => 0));

  React.useEffect(() => {
    setLP(prev => groups.map((_, i) => prev[i] ?? 'All'));
    setStart(prev => groups.map((_, i) => prev[i] ?? 0));
    if (active >= groups.length) setActive(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  const setGroupLP = (idx: number, v: LinesPer) =>
    setLP(prev => prev.map((x, i) => (i === idx ? v : x)));
  const setGroupStart = (idx: number, v: number) =>
    setStart(prev => prev.map((x, i) => (i === idx ? v : x)));

  const playSeq = (arr: MonoLine[]) => {
    if (!arr?.length) return;
    queuePlay(arr.map(a => a.no).join(' '));
  };

  const g = groups[active] ?? groups[0];
  const lp = linesPerByIdx[active] ?? 'All';
  const start = startByIdx[active] ?? 0;
  const all = g?.items || [];
  const pageSize = typeof lp === 'number' ? lp : all.length;
  const visible = lp === 'All' ? all : all.slice(start, start + pageSize);
  const canPrev = lp !== 'All' && start > 0;
  const canNext = lp !== 'All' && start + pageSize < all.length;
  const hasLines = all.length > 0;

  return (
    <section className="space-y-4">
      {groups.length > 1 && (
        <div className="-mx-1 px-1 py-1 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {groups.map((grp, i) => {
              const activeChip = i === active;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap transition-shadow focus:outline-none focus:ring-2 ${
                    activeChip
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow'
                      : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:shadow'
                  }`}
                  aria-pressed={activeChip}
                >
                  {grp.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-700 shadow p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h3 className="text-base md:text-lg font-semibold">{g?.title}</h3>

          {hasLines && (
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-700 dark:text-gray-300">Lines per view</label>
              <select
                value={lp as any}
                onChange={(e) =>
                  setGroupLP(active, (e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10)) as LinesPer)
                }
                className="px-2 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
              >
                {LINES_PER_OPTIONS.map(opt => (
                  <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
                ))}
              </select>

              <button className="px-2 py-1 rounded-lg border text-sm shadow hover:shadow-md"
                      onClick={() => playSeq(visible)}>
                ▶ Play Visible
              </button>
              <button className="px-2 py-1 rounded-lg border text-sm shadow hover:shadow-md"
                      onClick={() => playSeq(all)}>
                ▶▶ Play All
              </button>
            </div>
          )}
        </div>

        {/* Video, if any */}
        {g.videoSrc && (
          <div className="mt-3">
            <div className="relative w-full" style={{ paddingTop: g.aspectPct || '56.25%' }}>
              <iframe
                src={g.videoSrc}
                title={`${g.title} video`}
                className="absolute inset-0 w-full h-full rounded-xl border border-gray-200 dark:border-neutral-700 shadow"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Pager */}
        {hasLines && lp !== 'All' && (
          <div className="flex items-center gap-2 mt-2">
            <button className="px-2 py-1 rounded-lg border text-sm disabled:opacity-50"
                    disabled={!canPrev}
                    onClick={() => setGroupStart(active, Math.max(0, start - pageSize))}>
              ◀ Prev
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {Math.min(start + 1, all.length)}–{Math.min(start + pageSize, all.length)} of {all.length}
            </span>
            <button className="px-2 py-1 rounded-lg border text-sm disabled:opacity-50"
                    disabled={!canNext}
                    onClick={() => setGroupStart(active, Math.min(all.length - 1, start + pageSize))}>
              Next ▶
            </button>
          </div>
        )}

        {/* Lines */}
        {hasLines && (
          <div className="mt-3 space-y-3">
            {visible.map((row, idx) => (
              <div key={idx} className="p-3 rounded-2xl shadow border bg-white dark:bg-neutral-900 dark:border-neutral-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-lg">
                    <ClickableText text={row.no} onWord={(w) => speakNow(w)} />
                  </div>
                  <button className="px-3 py-1 rounded-xl border shadow" onClick={() => queuePlay(row.no)}>
                    ▶
                  </button>
                </div>
                {state.showPron && row.pron && <div className="text-sm text-gray-600 mt-1">{row.pron}</div>}
                {state.showEN && row.en && <div className="text-sm mt-1">{row.en}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
