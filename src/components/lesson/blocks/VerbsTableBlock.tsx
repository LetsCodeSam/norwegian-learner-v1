// src/components/lesson/blocks/VerbsTableBlock.tsx
import React from 'react';
import { AudioCtx } from '../../audio/AudioProvider';

type ColumnKey = 'inf' | 'pres' | 'pret' | 'perf' | 'fut';
type VerbRow = {
  inf: string;   inf_pron?: string;   inf_en?: string;
  pres: string;  pres_pron?: string;  pres_en?: string;
  pret: string;  pret_pron?: string;  pret_en?: string;
  perf: string;  perf_pron?: string;  perf_en?: string;
  fut: string;   fut_pron?: string;   fut_en?: string;
  notes?: string;
};

type VerbsGroup = { title?: string; verbs: VerbRow[] };

type VerbsBlock =
  | { title?: string; verbs: VerbRow[]; groups?: undefined }
  | { title?: string; groups: VerbsGroup[]; verbs?: undefined };

const COLS: { key: ColumnKey; label: string }[] = [
  { key: 'inf',  label: 'Infinitiv' },
  { key: 'pres', label: 'Presens' },
  { key: 'pret', label: 'Preteritum' },
  { key: 'perf', label: 'Perfektum' },
  { key: 'fut',  label: 'Futur' },
];

export default function VerbsTableBlock({
  block,
  scope,
}: {
  block: VerbsBlock;
  scope?: string;               // Optional: inherited label (e.g., nearest mono title)
}) {
  const { state, speakNow } = React.useContext(AudioCtx);

  // Normalize to groups: if no groups provided, treat top-level verbs as a single group
  const groups: VerbsGroup[] = React.useMemo(() => {
    if (Array.isArray((block as any).groups) && (block as any).groups.length) {
      return (block as any).groups as VerbsGroup[];
    }
    if (Array.isArray((block as any).verbs)) {
      return [{ title: block.title, verbs: (block as any).verbs as VerbRow[] }];
    }
    return [];
  }, [block]);

  // Which group is active
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    if (active >= groups.length) setActive(0);
  }, [groups.length, active]);

  const title = block.title || 'Verb';
  const hasGroups = groups.length > 1;
  const g = groups[active] || { title, verbs: [] };

  return (
    <section className="space-y-3 px-3">
      <div className="w-full max-w-full rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-700 shadow p-3 md:p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base md:text-lg font-semibold">
            {title}{scope ? ` — ${scope}` : ''}{g?.title && hasGroups ? ` • ${g.title}` : ''}
          </h3>
        </div>

        {/* Subsection selector (grid chips, like Monolog) */}
        {hasGroups && (
          <div className="mt-3 px-1" role="tablist" aria-label="Verb groups">
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
          {g.verbs.map((v, i) => (
            <div
              key={i}
              className="w-full max-w-full overflow-hidden rounded-2xl border border-gray-300 dark:border-neutral-700 shadow bg-white dark:bg-neutral-900 p-3"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-2 items-start">
                {COLS.map(({ key, label }) => (
                  <div key={key} className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
                    <button
                      className="underline decoration-dotted hover:decoration-solid"
                      onClick={() => speakNow((v as any)[key] as string)}
                      title="Play"
                    >
                      {(v as any)[key] as string}
                    </button>
                    {state.showPron && (v as any)[`${key}_pron`] && (
                      <div className="text-xs text-gray-500">{(v as any)[`${key}_pron`]}</div>
                    )}
                    {state.showEN && (v as any)[`${key}_en`] && (
                      <div className="text-xs mt-0.5">{(v as any)[`${key}_en`]}</div>
                    )}
                  </div>
                ))}

                {/* Notes (optional) */}
                {v.notes && (
                  <div className="min-w-0 md:col-span-6">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Notater</div>
                    <div className="text-xs">{v.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {g.verbs.length === 0 && (
            <div className="text-sm text-gray-500">Ingen verb i denne delen.</div>
          )}
        </div>
      </div>
    </section>
  );
}
