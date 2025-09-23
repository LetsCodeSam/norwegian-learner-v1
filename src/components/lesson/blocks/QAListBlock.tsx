import React from 'react';
import { AudioCtx } from '../../audio/AudioProvider';
import { ClickableText } from '../../common/ClickableText';

type QAItem = {
  noQ: string; pronQ?: string; enQ?: string;
  noA: string; pronA?: string; enA?: string;
};

type QAGroup = { title?: string; items: QAItem[] };

type QABlock =
  | { title?: string; items: QAItem[]; groups?: undefined }
  | { title?: string; groups: QAGroup[]; items?: undefined };

export function QAListBlock({ block }: { block: QABlock }) {
  const { state, speakNow, queuePlay } = React.useContext(AudioCtx);

  // Normalize to groups: if no groups provided, treat top-level items as one group
  const groups: QAGroup[] = React.useMemo(() => {
    if (Array.isArray((block as any).groups) && (block as any).groups.length) {
      return (block as any).groups as QAGroup[];
    }
    if (Array.isArray((block as any).items)) {
      return [{ title: block.title, items: (block as any).items as QAItem[] }];
    }
    return [];
  }, [block]);

  // Which group is active
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    if (active >= groups.length) setActive(0);
  }, [groups.length, active]);

  const title = block.title || 'Spørsmål og svar';
  const hasGroups = groups.length > 1;
  const g = groups[active] || { title, items: [] };

  return (
    <section className="space-y-3 px-3">
      <div className="w-full max-w-full rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-700 shadow p-3 md:p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base md:text-lg font-semibold">
            {title}{g?.title && hasGroups ? ` — ${g.title}` : ''}
          </h3>
        </div>

        {/* Subsection selector (3 per row on mobile) */}
        {hasGroups && (
          <div className="mt-3 px-1" role="tablist" aria-label="Q&A groups">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {groups.map((grp, i) => {
                const activeChip = i === active;
                return (
                  <button
                    key={i}
                    type="button"
                    title={grp.title || `Del ${i + 1}`}
                    aria-pressed={activeChip}
                    onClick={() => setActive(i)}
                    className={[
                      "w-full px-3 py-1.5 rounded-full border transition-shadow focus:outline-none focus:ring-2",
                      "text-xs sm:text-sm",
                      "truncate",
                      activeChip
                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow"
                        : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:shadow",
                    ].join(" ")}
                  >
                    {grp.title || `Del ${i + 1}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cards for the active group */}
        <div className="mt-3 space-y-3">
          {g.items.map((q, i) => (
            <details
              key={i}
              className="w-full max-w-full overflow-hidden rounded-2xl border border-gray-300 dark:border-neutral-700 shadow bg-white dark:bg-neutral-900"
            >
              <summary className="cursor-pointer p-3 text-base select-none">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <ClickableText text={q.noQ} onWord={(w) => speakNow(w)} />
                    {state.showPron && q.pronQ && (
                      <div className="text-sm text-gray-600 mt-1">{q.pronQ}</div>
                    )}
                    {state.showEN && q.enQ && (
                      <div className="text-sm mt-1">{q.enQ}</div>
                    )}
                  </div>
                  <button
                    className="px-3 py-1 rounded-xl border shadow shrink-0"
                    title="Play question"
                    onClick={(e) => {
                      e.preventDefault();
                      queuePlay(q.noQ);
                    }}
                  >
                    ▶ Q
                  </button>
                </div>
              </summary>

              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <strong>Svar:</strong>{' '}
                    <ClickableText text={q.noA} onWord={(w) => speakNow(w)} />
                    {state.showPron && q.pronA && (
                      <div className="text-sm text-gray-600 mt-1">{q.pronA}</div>
                    )}
                    {state.showEN && q.enA && (
                      <div className="text-sm mt-1">{q.enA}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="px-3 py-1 rounded-xl border shadow"
                      title="Play answer"
                      onClick={() => queuePlay(q.noA)}
                    >
                      ▶ A
                    </button>
                    <button
                      className="px-3 py-1 rounded-xl border shadow"
                      title="Play both"
                      onClick={() => queuePlay(`${q.noQ} ${q.noA}`)}
                    >
                      ▶▶
                    </button>
                  </div>
                </div>
              </div>
            </details>
          ))}

          {g.items.length === 0 && (
            <div className="text-sm text-gray-500">Ingen spørsmål i denne delen.</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default QAListBlock;
