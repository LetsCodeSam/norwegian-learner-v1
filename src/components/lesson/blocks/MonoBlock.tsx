// File: src/components/lesson/blocks/MonoBlock.tsx
// Monolog with optional grouped subsections and a subsection sub-menu (chips).
// Now supports a "video" subsection that renders responsively on mobile.

import React from 'react';
import { AudioCtx } from '../../audio/AudioProvider';
import { ClickableText } from '../../common/ClickableText';

type MonoLine = { no: string; pron?: string; en?: string };
type LinesPer = 1 | 5 | 10 | 'All';
const LINES_PER_OPTIONS: LinesPer[] = [1, 5, 10, 'All'];

type VideoData = { src: string; title?: string; ratio?: '16:9' | '4:3' | '1:1' | '21:9' };

function toLines(maybe: any): MonoLine[] {
  if (!maybe) return [];
  if (Array.isArray(maybe)) {
    return (maybe as any[]).map((x) => (typeof x === 'string' ? { no: x } : (x as MonoLine)));
  }
  if (Array.isArray(maybe.items)) return toLines(maybe.items);
  if (Array.isArray(maybe.model)) return toLines(maybe.model);
  if (Array.isArray(maybe.paragraphs)) return toLines(maybe.paragraphs);
  if (Array.isArray(maybe.text)) return toLines(maybe.text);
  return [];
}

function normVideoSrc(src: string): string {
  // If someone pasted a plain Vimeo page URL, convert to player URL.
  const m = src.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return src;
}

function ratioClass(r?: VideoData['ratio']): string {
  switch (r) {
    case '4:3': return 'aspect-[4/3]';
    case '1:1': return 'aspect-square';
    case '21:9': return 'aspect-[21/9]';
    default: return 'aspect-video'; // 16:9
  }
}

function VideoFrame({ src, title, ratio }: VideoData) {
  return (
    <div className={`w-full ${ratioClass(ratio)} bg-black rounded-xl overflow-hidden`}>
      <iframe
        src={normVideoSrc(src)}
        title={title || 'Embedded video'}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

type Group = { title: string; items: MonoLine[]; video?: VideoData };

function extractGroups(block: any): Group[] {
  if (Array.isArray(block?.groups) && block.groups.length) {
    return block.groups.map((g: any, idx: number) => {
      // accept { video: {src, ratio?} } or { embed: url } or { url: url }
      const videoSrc: string | undefined = g?.video?.src || g?.embed || g?.url;
      const video: VideoData | undefined = videoSrc
        ? { src: String(videoSrc), title: g?.title, ratio: g?.video?.ratio }
        : undefined;

      return {
        title: g?.title || `Section ${idx + 1}`,
        items: toLines(g),
        video,
      };
    });
  }
  // fallback: single text group from old shape
  return [{ title: block?.title || 'Monolog', items: toLines(block) }];
}

export default function MonoBlock({ block }: { block: any }) {
  const { state, speakNow, queuePlay } = React.useContext(AudioCtx);
  const groups = React.useMemo(() => extractGroups(block), [block]);

  // Active subsection
  const [active, setActive] = React.useState(0);

  // Per-group paging state
  const [linesPerByIdx, setLP] = React.useState<LinesPer[]>(() => groups.map(() => 'All'));
  const [startByIdx, setStart] = React.useState<number[]>(() => groups.map(() => 0));

  React.useEffect(() => {
    setLP((prev) => groups.map((_, i) => prev[i] ?? 'All'));
    setStart((prev) => groups.map((_, i) => prev[i] ?? 0));
    if (active >= groups.length) setActive(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length]);

  const setGroupLP = (i: number, v: LinesPer) => setLP((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const setGroupStart = (i: number, v: number) => setStart((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  const g = groups[active] ?? groups[0];
  const lp = linesPerByIdx[active] ?? 'All';
  const start = startByIdx[active] ?? 0;

  const all = g?.items || [];
  const hasText = all.length > 0;
  const pageSize = typeof lp === 'number' ? lp : all.length;
  const visible = lp === 'All' ? all : all.slice(start, start + pageSize);
  const canPrev = lp !== 'All' && start > 0;
  const canNext = lp !== 'All' && start + pageSize < all.length;

  return (
    <section className="space-y-4">
      {/* Sub-menu chips */}
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
                  className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap transition-shadow focus:outline-none focus:ring-2
                    ${activeChip
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow'
                      : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:shadow'}`}
                  aria-pressed={activeChip}
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
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h3 className="text-base md:text-lg font-semibold">{g?.title}</h3>

          {/* Controls only when there are text lines to paginate/play */}
          {hasText && (
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-700 dark:text-gray-300">Lines per view</label>
              <select
                value={lp as any}
                onChange={(e) =>
                  setGroupLP(active, (e.target.value === 'All' ? 'All' : parseInt(e.target.value, 10)) as LinesPer)
                }
                className="px-2 py-1 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
              >
                {LINES_PER_OPTIONS.map((opt) => (
                  <option key={String(opt)} value={String(opt)}>
                    {String(opt)}
                  </option>
                ))}
              </select>

              <button className="px-2 py-1 rounded-lg border text-sm shadow hover:shadow-md" onClick={() => queuePlay(visible.map(v => v.no).join(' '))}>
                ▶ Play Visible
              </button>
              <button className="px-2 py-1 rounded-lg border text-sm shadow hover:shadow-md" onClick={() => queuePlay(all.map(v => v.no).join(' '))}>
                ▶▶ Play All
              </button>
            </div>
          )}
        </div>

        {/* Video (if present) */}
        {g.video && (
          <div className="mt-3">
            <VideoFrame src={g.video.src} title={g.video.title || g.title} ratio={g.video.ratio} />
          </div>
        )}

        {/* Pager */}
        {hasText && lp !== 'All' && (
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
        {hasText && (
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
