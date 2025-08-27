import React from 'react';
import { LinesBlock } from './blocks/LinesBlock';
import { QAListBlock } from './blocks/QAListBlock';
import { MonoBlock } from './blocks/MonoBlock';
import { VerbsTableBlock } from './blocks/VerbsTableBlock';


export function LessonTabs({ blocks }: { blocks: any[] }) {
const [tab, setTab] = React.useState(() => {
const first = blocks.find(b => b.kind !== 'image');
return first?.kind || 'lines';
});
const TabBtn = ({ id, label }: { id: string; label: string }) => (
<button className={`px-3 py-1 rounded-xl border ${tab===id ? 'bg-black text-white' : 'bg-white'}`} onClick={() => setTab(id)}>{label}</button>
);
const kindsPresent = new Set(blocks.map(b => b.kind));
return (
<div className="space-y-3">
<div className="flex flex-wrap gap-2 sticky top-[88px] z-20 bg-gray-100 py-2">
{kindsPresent.has('lines') && <TabBtn id="lines" label="Lines" />}
{kindsPresent.has('qa_list') && <TabBtn id="qa_list" label="Q&A" />}
{kindsPresent.has('mono') && <TabBtn id="mono" label="Monolog" />}
{kindsPresent.has('verbs_table') && <TabBtn id="verbs_table" label="Verbs" />}
</div>
{blocks.map((b, i) => {
switch (b.kind) {
case 'lines': return tab==='lines' ? <LinesBlock key={i} block={b} /> : null;
case 'qa_list': return tab==='qa_list' ? <QAListBlock key={i} block={b} /> : null;
case 'mono': return tab==='mono' ? <MonoBlock key={i} block={b} /> : null;
case 'verbs_table': return tab==='verbs_table' ? <VerbsTableBlock key={i} block={b} /> : null;
default: return null;
}
})}
</div>
);
}