// File: src/components/lesson/blocks/QAListBlock.tsx
// Q&A with per-word clicks, ▶ for Q and A, Lines-per dropdown (1/5/10/All),
// and PRON/EN lines under the **answer** (separate rows).

import React, { useEffect, useMemo, useState } from 'react';
import { AudioCtx } from '../../audio/AudioProvider';
import { ClickableText } from '../../common/ClickableText';

type QAItem = {
  noQ?: string; noA?: string;
  // allow multiple possible keys in data
  pronQ?: string; enQ?: string;
  pronA?: string; enA?: string;
  pron?: string;  en?: string;
  [k: string]: any;
};

type LinesPer = 1 | 5 | 10 | 'all';

function pickItems(block: any): QAItem[] {
  if (!block) return [];
  if (Array.isArray(block.items)) return block.items as QAItem[];
  if (Array.isArray(block.list))  return block.list as QAItem[];
  return [];
}

const firstString = (obj: any, keys: string[]) =>
  keys.map(k => obj?.[k]).find(v => typeof v === 'string' && v.trim().length) || '';

export function QAListBlock({ block }: { block: any }) {
  const { state, speakNow, queuePlay } = React.useContext(AudioCtx);
  const items = useMemo(() => pickItems(block), [block]);

  const [linesPer, setLinesPer] = useState<LinesPer>('all');
  const [start, setStart] = useState(0);

  useEffect(() => { if (start > Math.max(0, items.length - 1)) setStart(0); }, [items.length, start]);
  useEffect(() => { setStart(0); }, [linesPer]);

  if (!items.length) {
    console.warn('QAListBlock: no items in block:', block);
    return <div className="text-sm text-gray-500">No Q&A content.</div>;
  }

  const pageSize: number = linesPer === 'all' ? items.length : linesPer;
  const visible = linesPer === 'all' ? items : items.slice(start, start + pageSize);
  const canPrev = linesPer !== 'all' && start > 0;
  const canNext = linesPer !== 'all' && start + pageSize < items.length;

  const playVisible = () => {
    const texts = visible.flatMap(q => [q.noQ, q.noA]).filter(Boolean) as string[];
    if (texts.length) queuePlay(texts.join(' '));
  };
  const playAll = () => {
    const texts = items.flatMap(q => [q.noQ, q.noA]).filter(Boolean) as string[];
    if (texts.length) queuePlay(texts.join(' '));
  };

  return (
    <section className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Lines per view</label>
          <select
            value={linesPer === 'all' ? 'all' : String(linesPer)}
            onChange={(e) => {
              const v = e.target.value;
              setLinesPer(v === 'all' ? 'all' : (parseInt(v, 10) as LinesPer));
            }}
            className="rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-sm"
          >
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="all">All</option>
          </select>

          {linesPer !== 'all' && (
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-700 disabled:opacity-50"
                onClick={() => setStart((s) => Math.max(0, s - pageSize))}
                disabled={!canPrev}
              >◀ Prev</button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {start + 1}-{Math.min(start + pageSize, items.length)} of {items.length}
              </span>
              <button
                className="px-3 py-1 rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-700 disabled:opacity-50"
                onClick={() => setStart((s) => Math.min(items.length - 1, s + pageSize))}
                disabled={!canNext}
              >Next ▶</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-xl border shadow bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  onClick={playVisible}>▶ Play Visible</button>
          <button className="px-3 py-1 rounded-xl border shadow bg-white dark:bg-neutral-900 dark:border-neutral-700"
                  onClick={playAll}>▶▶ Play All</button>
        </div>
      </div>

      {/* Q&A list */}
      {visible.map((q, i) => {
        const qText = q.noQ || '';
        const aText = q.noA || '';
        // robust fields: prefer A-specific; fall back to generic pron/en
        const aPron = firstString(q, ['pronA', 'aPron', 'pron']);
        const aEn   = firstString(q, ['enA',   'aEn',   'en'  ]);
        const qPron = firstString(q, ['pronQ', 'qPron'         ]);
        const qEn   = firstString(q, ['enQ',   'qEn'           ]);

        return (
          <details key={start + i}
                   className="w-full max-w-full overflow-hidden rounded-2xl border border-gray-300 dark:border-neutral-700 shadow bg-white dark:bg-neutral-900">
            <summary className="cursor-pointer p-3 text-base">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <ClickableText text={qText} onWord={(w) => speakNow(w)} />
                  {/* Optional: show question PRON/EN inline when toggles are on */}
                  {state.showPron && qPron && (
                    <div className="text-sm text-gray-600 mt-1">{qPron}</div>
                  )}
                  {state.showEN && qEn && (
                    <div className="text-sm mt-1">{qEn}</div>
                  )}
                </div>
                <button
                  className="px-3 py-1 rounded-xl border shadow"
                  onClick={(e) => { e.preventDefault(); qText && queuePlay(qText); }}
                  title="Play question" aria-label="Play question"
                >▶ Q</button>
              </div>
            </summary>

            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <strong>Svar:</strong> <ClickableText text={aText} onWord={(w) => speakNow(w)} />
                </div>
                <button
                  className="px-3 py-1 rounded-xl border shadow"
                  onClick={() => aText && queuePlay(aText)}
                  title="Play answer" aria-label="Play answer"
                >▶ A</button>
              </div>

              {/* Answer PRON + EN on their own rows */}
              {state.showPron && aPron && (
                <div className="text-sm text-gray-600 pl-6">{aPron}</div>
              )}
              {state.showEN && aEn && (
                <div className="text-sm pl-6">{aEn}</div>
              )}
            </div>
          </details>
        );
      })}
    </section>
  );
}

export default QAListBlock;
