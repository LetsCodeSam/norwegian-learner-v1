// File: src/components/lesson/LessonTabs.tsx
import React from 'react';

// Block components (each accepts { block: any })
import { LinesBlock } from './blocks/LinesBlock';
import { QAListBlock } from './blocks/QAListBlock';
import VerbsTableBlock  from './blocks/VerbsTableBlock';
import MonoBlock from './blocks/MonoBlock';

type BlockKind = 'lines' | 'qa_list' | 'mono' | 'verbs_table' | 'image' | string;
interface Block { kind: BlockKind; [key: string]: any }

function firstAvailableTab(blocks: Block[]): BlockKind {
  const order: BlockKind[] = ['lines', 'qa_list', 'mono', 'verbs_table'];
  const present = new Set(blocks.map((b) => b?.kind));
  const firstNonImage = blocks.find((b) => b?.kind && b.kind !== 'image')?.kind as BlockKind | undefined;
  return order.find((k) => present.has(k)) ?? firstNonImage ?? 'lines';
}

export function LessonTabs({ blocks }: { blocks: Block[] }) {
  const [tab, setTab] = React.useState<BlockKind>(() => firstAvailableTab(blocks ?? []));

  // If blocks change and current tab no longer exists, pick the next best
  React.useEffect(() => {
    const kinds = new Set((blocks ?? []).map((b) => b?.kind));
    if (!kinds.has(tab)) setTab(firstAvailableTab(blocks ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const kindsPresent = React.useMemo(() => new Set((blocks ?? []).map((b) => b?.kind)), [blocks]);

  const TabBtn = ({ id, label }: { id: BlockKind; label: string }) => {
    if (!kindsPresent.has(id)) return null;
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        aria-selected={active}
        aria-controls={`panel-${id}`}
        className={`px-3 py-1 rounded-xl border text-sm transition-shadow
          ${active
            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow'
            : 'bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:shadow'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Tabs row - sticky under the lesson header controls */}
      <div className="flex flex-wrap gap-2 sticky top-[88px] z-20 bg-gray-100/60 dark:bg-neutral-900/60 backdrop-blur px-2 py-2 rounded-lg">
        <TabBtn id="lines" label="Lines" />
        <TabBtn id="qa_list" label="Q&A" />
        <TabBtn id="mono" label="Monolog" />
        <TabBtn id="verbs_table" label="Verbs" />
      </div>

      {/* Render only blocks matching the active tab */}
      {blocks?.map((b, i) => {
        if (b?.kind !== tab) return null;
        switch (b.kind) {
          case 'lines':
            return <LinesBlock key={i} block={b} />;
          case 'qa_list':
            return <QAListBlock key={i} block={b} />;
          case 'mono':
            return <MonoBlock key={i} block={b} />;
          case 'verbs_table':
            return <VerbsTableBlock key={i} block={b} />;
          default:
            return null; // ignore images/unknown kinds
        }
      })}
    </div>
  );
}

export default LessonTabs;
