// File: src/components/lesson/blocks/MonoBlock.tsx
// Monolog with optional grouped subsections **and a subsection sub‑menu (chips)**.
// Adds responsive video support (Vimeo/YouTube or direct embed) while remaining
// backward compatible with existing JSON shapes.

import React from 'react';
import { AudioCtx } from '../../audio/AudioProvider';
import { ClickableText } from '../../common/ClickableText';

type MonoLine = { no: string; pron?: string; en?: string };

type LinesPer = 1 | 5 | 10 | 'All';
const LINES_PER_OPTIONS: LinesPer[] = [1, 5, 10, 'All'];

// ---- Video helpers --------------------------------------------------------
// We accept either an embeddable URL or a page URL and normalize it.
// JSON can provide: group.video.src (preferred), or group.embed / group.url
// Optional group.video.ratio: '16:9' | '4:3' | '1:1' | '21:9'

type VideoData = { src: string; title?: string; ratio?: '16:9' | '4:3' | '1:1' | '21:9' };

function normalizeEmbedSrc(src: string): string {
  try {
    const u = new URL(src);
    const host = u.hostname.replace(/^www\./, '');
    const firstPath = u.pathname.split('/').filter(Boolean)[0] || '';

    // Vimeo page URL like vimeo.com/123456789 -> player URL
    const isDigits = firstPath.length > 0 && [...firstPath].every((c) => c >= '0' && c <= '9');
    if (host.endsWith('vimeo.com') && isDigits) {
      return `https://player.vimeo.com/video/${firstPath}`;
    }

    // YouTube watch -> nocookie embed
    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (host === 'youtu.be' && firstPath) {
      return `https://www.youtube-nocookie.com/embed/${firstPath}`;
    }
  } catch (_) {}
  return src; // already an embed URL or other provider
}

function ratioPadding(r?: VideoData['ratio']): string {
  switch (r) {
    case '4:3': return '75%';
    case '1:1': return '100%';
    case '21:9': return String((9 / 21) * 100) + '%';
    default: return '56.25%'; // 16:9 default
  }
}

function ResponsiveVideo({ src, title, ratio }: VideoData) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black">
      {/* padding-top hack keeps the aspect ratio without a plugin */}
      <div style={{ paddingTop: ratioPadding(ratio) }} />
      <iframe
        src={normalizeEmbedSrc(src)}
        title={title || 'Embedded video'}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

// ---- Existing helpers -----------------------------------------------------

function toLines(maybe: any): MonoLine[] {
  if (!maybe) return [];
  // direct list of lines
  if (Array.isArray(maybe)) {
    // strings or objects
    return (maybe as any[]).map((x) => (typeof x === 'string' ? { no: x } : (x as MonoLine)));
  }
  // common variants
  if (Array.isArray(maybe.items)) return toLines(maybe.items);
  if (Array.isArray(maybe.model)) return toLines(maybe.model);
  if (Array.isArray(maybe.paragraphs)) return toLines(maybe.paragraphs);
  if (Array.isArray(maybe.text)) return toLines(maybe.text);
  return [];
}

function extractGroups(block: any): { title: string; items: MonoLine[]; video?: VideoData }[] {
  if (Array.isArray(block?.groups) && block.groups.length) {
    return block.groups.map((g: any, idx: number) => {
      const src: string | undefined = g?.video?.src || g?.embed || g?.url; // accept several keys
      const video: VideoData | undefined = src
        ? { src: String(src), title: g?.title, ratio: g?.video?.ratio }
        : undefined;
      return { title: g?.title || `Section ${idx + 1}`, items: toLines(g), video };
    });
  }
  // fallback: single group from the old shape; also accept top-level video/embed/url
  const src: string | undefined = block?.video?.src || block?.embed || block?.url;
  const video: VideoData | undefined = src
    ? { src: String(src), title: block?.title, ratio: block?.video?.ratio }
    : undefined;
  return [
    {
      title: block?.title || 'Monolog',
      items: toLines(block),
      video,
    },
  ];
}

export default function MonoBlock({ block }: { block: any }) {
  const { state, speakNow, queuePlay } = React.useContext(AudioCtx);
  const groups = React.useMemo(() => extractGroups(block), [block]);

  // Sub‑menu active section (if multiple)
  const [active, setActive] = React.useState(0);

  // Per‑group paging state
  const [linesPerByIdx, setLP] = React.useState<LinesPer[]>(() => groups.map(() => 'All'));
  const [startByIdx, setStart] = React.useState<number[]>(() => groups.map(() => 0));

  // When groups change, keep arrays in sync and clamp active index
  React.useEffect(() => {
    setLP((prev) => groups.map((_, i) => prev[i] ?? 'All'));
    setStart((prev) => groups.map((_, i) => prev[i] ?? 0));
    if (active >= groups.length) setActive(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  const setGroupLP = (i: number, v: LinesPer) =>
    setLP((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setGroupStart = (i: number, v: number) =>
    setStart((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  const playSeq = (arr: MonoLine[]) => {
    if (!arr?.length) return;
    queuePlay(arr.map((a) => a.no).join(' '));
  };

  // Pick the current group to render (or the only one)
  const g = groups[active] ?? groups[0];
  const lp = linesPerByIdx[active] ?? 'All';
  const start = startByIdx[active] ?? 0;
  const all = g?.items || [];
  const pageSize = typeof lp === 'number' ? lp : all.length;
  const visible = lp === 'All' ? all : all.slice(start, start + pageSize);
  const canPrev = lp !== 'All' && start > 0;
  const canNext = lp !== 'All' && start + pageSize < all.length;

  return (
    <section className="space-y-4">
      {/* Sub‑menu chips (only when more than one subsection) */}
      {/* subsection chips – grid (3 per row on mobile) */}
        {groups.length > 1 && (
          <div className="px-2" role="tablist" aria-label="Sections">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {groups.map((grp, i) => {
                const activeChip = i === active;
                return (
                  <button
                    key={i}
                    type="button"
                    title={grp.title}
                    aria-pressed={activeChip}
                    onClick={() => setActive(i)}
                    className={[
                      "w-full px-3 py-1.5 rounded-full border transition-shadow focus:outline-none focus:ring-2",
                      "text-xs sm:text-sm",    // smaller text on mobile to fit neatly
                      "truncate",              // prevent tall chips when titles are long
                      activeChip
                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow"
                        : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:shadow",
                    ].join(" ")}
                  >
                    {grp.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}


      {/* Active subsection card */}
      <div className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-700 shadow p-3 md:p-4">
        {/* Section header */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h3 className="text-base md:text-lg font-semibold">{g?.title}</h3>

          <div className="flex items-center gap-2 ml-auto">
            {/* Lines-per-view */}
            <label className="text-sm text-gray-700 dark:text-gray-300">Lines per view</label>
            <select
              value={lp as any}
              onChange={(e) => setGroupLP(active, (e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10)) as LinesPer)}
              className="px-2 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
            >
              {LINES_PER_OPTIONS.map((opt) => (
                <option key={String(opt)} value={String(opt)}>
                  {String(opt)}
                </option>
              ))}
            </select>

            {/* Play controls */}
            <button
              className="px-2 py-1 rounded-lg border text-sm shadow hover:shadow-md"
              onClick={() => playSeq(visible)}
              title="Play Visible"
            >
              ▶ Play Visible
            </button>
            <button
              className="px-2 py-1 rounded-lg border text-sm shadow hover:shadow-md"
              onClick={() => playSeq(all)}
              title="Play All"
            >
              ▶▶ Play All
            </button>
          </div>
        </div>

        {/* Video (if provided) */}
        {g.video && (
          <div className="mt-3">
            <ResponsiveVideo src={g.video.src} title={g.video.title || g.title} ratio={g.video.ratio} />
          </div>
        )}

        {/* Pager */}
        {lp !== 'All' && (
          <div className="flex items-center gap-2 mt-2">
            <button
              className="px-2 py-1 rounded-lg border text-sm disabled:opacity-50"
              disabled={!canPrev}
              onClick={() => setGroupStart(active, Math.max(0, start - pageSize))}
            >
              ◀ Prev
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {Math.min(start + 1, all.length)}–{Math.min(start + pageSize, all.length)} of {all.length}
            </span>
            <button
              className="px-2 py-1 rounded-lg border text-sm disabled:opacity-50"
              disabled={!canNext}
              onClick={() => setGroupStart(active, Math.min(all.length - 1, start + pageSize))}
            >
              Next ▶
            </button>
          </div>
        )}

        {/* Lines */}
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
              {state.showPron && row.pron && (
                <div className="text-sm text-gray-600 mt-1">{row.pron}</div>
              )}
              {state.showEN && row.en && (
                <div className="text-sm mt-1">{row.en}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
