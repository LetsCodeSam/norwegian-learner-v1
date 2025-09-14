// File: src/components/lesson/blocks/VerbsTableBlock.tsx
// Cards-only verbs view with sizing option + tuned horizontal scrollbar behavior.
// - "Viewport": clamp()-based responsive fonts (by screen width)
// - "Fit to card": container queries (fonts shrink only when the card is narrow)
// - Scrollbar: shows only when needed, reserves gutter space, with extra bottom
//   padding so it never hugs the English line.

import React, { useMemo, useState } from 'react';
import { AudioCtx } from '../../audio/AudioProvider';

type VerbRow = Record<string, any>;

type SizeMode = 'viewport' | 'container';

const COLS = [
  { key: 'inf',  label: 'Infinitiv' },
  { key: 'pres', label: 'Presens' },
  { key: 'pret', label: 'Preteritum' },
  { key: 'perf', label: 'Perfektum' },
  { key: 'fut',  label: 'Futur' },
] as const;

const pick = (obj: any, paths: string[]): string | undefined => {
  for (const p of paths) {
    const v = p.split('.').reduce((acc, k) => (acc ? (acc as any)[k] : undefined), obj);
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
};
const getForm = (v: VerbRow, key: string) => pick(v, [key, `${key}_no`, `forms.${key}`, `form.${key}`]);
const getPron = (v: VerbRow, key: string) => pick(v, [`${key}_pron`, `pron_${key}`, `${key}Pron`, `pron.${key}`, `pronunciation.${key}`, 'pron', 'pron_no']);
const getEn   = (v: VerbRow, key: string) => pick(v, [`${key}_en`, `en_${key}`, `${key}En`, `en.${key}`, `english.${key}`, 'en']);

export default function VerbsTableBlock({ block }: { block: any }) {
  const { state, speakNow, queuePlay } = React.useContext(AudioCtx);
  const verbs: VerbRow[] = useMemo(() => (Array.isArray(block?.verbs) ? block.verbs : []), [block]);

  const [sizeMode, setSizeMode] = useState<SizeMode>('viewport');

  if (!verbs.length) return <div className="text-sm text-gray-500">No verbs provided.</div>;

  // font classes for the Norwegian form text
  const formClass =
    sizeMode === 'viewport'
      ? 'text-[clamp(12px,3.2vw,16px)] md:text-base'
      : 'verb-form text-base md:text-lg';

  const labelClass = sizeMode === 'viewport' ? 'text-[10px] md:text-[11px]' : 'verb-label text-[11px] md:text-[12px]';
  const metaClass  = sizeMode === 'viewport' ? 'text-[11px] md:text-[12px]' : 'verb-meta text-[12px] md:text-[13px]';

  return (
    <section className="space-y-3">
      {/* Sizing option */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-300">Sizing</span>
        <div className="inline-flex rounded-xl border border-gray-300 dark:border-neutral-700 overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1 text-sm ${sizeMode === 'viewport' ? 'bg-black text-white' : 'bg-white dark:bg-neutral-900'}`}
            onClick={() => setSizeMode('viewport')}
            title="Shrink based on screen width"
          >
            Viewport
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm ${sizeMode === 'container' ? 'bg-black text-white' : 'bg-white dark:bg-neutral-900'}`}
            onClick={() => setSizeMode('container')}
            title="Shrink only when the card is narrow"
          >
            Fit to card
          </button>
        </div>
      </div>

      {/* Container-query CSS (used when sizeMode === 'container') */}
      {sizeMode === 'container' && (
        <style>{`
          /* Enable font scaling based on the card's width */
          @container (max-width: 560px) {
            .verb-form { font-size: 14px; }
            .verb-label, .verb-meta { font-size: 11px; }
            .verb-grid { column-gap: 1rem; }
          }
          @container (max-width: 500px) {
            .verb-form { font-size: 13px; }
            .verb-label, .verb-meta { font-size: 10.5px; }
          }
          @container (max-width: 440px) {
            .verb-form { font-size: 12px; }
            .verb-label, .verb-meta { font-size: 10px; }
          }
        `}</style>
      )}

      {/* Cards list */}
      <div className="grid grid-cols-1 gap-4 max-w-5xl mx-auto">
        {verbs.map((v, i) => {
          const notes = (v.notes as string) || '';
          const playAll = () => {
            const seq = COLS.map((c) => getForm(v, c.key)).filter(Boolean).join(' ');
            if (seq) queuePlay(seq);
          };
          return (
            <div
              key={i}
              className={`p-3 md:p-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow border bg-white dark:bg-neutral-900 dark:border-neutral-700 ${
                sizeMode === 'container' ? '[container-type:inline-size]' : ''
              }`}
            >
              <div className="flex items-center justify-end">
                <button
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-300 dark:border-neutral-700 shadow flex items-center justify-center hover:shadow-md"
                  onClick={playAll}
                  title="Play all forms"
                  aria-label="Play all forms"
                >
                  ▶
                </button>
              </div>

              {/* Five fixed columns. On very narrow widths this block scrolls horizontally. */}
              <div
                className="mt-1 sm:overflow-x-auto sm:overflow-y-hidden pb-4 sm:pb-3"
                style={{ scrollbarGutter: 'stable both-edges' as any }}
            >
                <div
                    className="
                    verb-grid grid grid-cols-3 sm:grid-cols-5
                    gap-x-5 md:gap-x-8 gap-y-2
                    min-w-0 sm:min-w-[40rem] md:min-w-[44rem] lg:min-w-[48rem]"
  >
                  {COLS.map((c) => {
                    const form = getForm(v, c.key) || '';
                    const pron = getPron(v, c.key);
                    const en   = getEn(v, c.key);
                    return (
                      <div key={c.key} className="min-w-0 leading-tight">
                        <div className={`uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 ${labelClass}`}>{c.label}</div>
                        <button
                          className={`underline decoration-1 underline-offset-2 hover:decoration-2 break-words text-left ${formClass}`}
                          onClick={() => form && speakNow(form)}
                          title={`Play ${c.label.toLowerCase()}`}
                        >
                          {form}
                        </button>
                        {state.showPron && pron && (
                          <div className={`text-gray-600 mt-0.5 break-words ${metaClass}`}>{pron}</div>
                        )}
                        {state.showEN && en && (
                          <div className={`mt-0.5 break-words ${metaClass}`}>{en}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {notes && (
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] md:text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  ⚠ {notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
