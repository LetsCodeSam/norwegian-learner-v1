import React from 'react';
import { fetchJSON } from '../../lib/fetchJSON';
import { ImageBlock } from './blocks/ImageBlock';
import { LessonHeader } from './LessonHeader';
import { LessonTabs } from './LessonTabs';


export function LessonPage({ title, path }: { title: string; path: string }) {
const [lesson, setLesson] = React.useState<any>(null);
React.useEffect(() => { fetchJSON(path).then(setLesson).catch(console.error); }, [path]);
if (!lesson) return <div className="p-4">Loading…</div>;
const blocks = lesson.blocks || [];
const img = blocks.find((b: any) => b.kind === 'image');
return (
<div className="max-w-4xl mx-auto p-3 pb-24">
<div className="flex items-center justify-between py-2">
<h1 className="text-2xl font-semibold">{lesson.title || title}</h1>
<button className="px-3 py-1 rounded-xl border">☆ Save</button>
</div>
<LessonHeader />
{img && <div className="my-3"><ImageBlock block={img} /></div>}
<LessonTabs blocks={blocks.filter((b: any) => b.kind !== 'image')} />
</div>
);
}