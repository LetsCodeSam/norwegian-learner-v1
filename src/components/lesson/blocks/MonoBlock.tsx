import React, { useState } from 'react';
import { AudioCtx } from '../../audio/AudioProvider';
import { ClickableText } from '../../common/ClickableText';


export function MonoBlock({ block }: { block: any }) {
const { state, speakNow } = React.useContext(AudioCtx);
const items = block.items?.[0]?.model || [];
const [idx, setIdx] = useState(0);
const current = items[idx] || {};
return (
<section className="space-y-3">
<div className="p-3 rounded-2xl shadow border bg-white">
<div className="text-lg"><ClickableText text={current.no} onWord={(w) => speakNow(w)} /></div>
{state.showPron && <div className="text-sm text-gray-600 mt-1">{current.pron}</div>}
{state.showEN && <div className="text-sm mt-1">{current.en}</div>}
<div className="flex items-center gap-2 mt-2">
<button className="px-3 py-1 rounded-xl border" onClick={() => setIdx((p) => Math.max(0, p-1))}>◀ Prev</button>
<span className="text-sm">{idx+1}/{items.length}</span>
<button className="px-3 py-1 rounded-xl border" onClick={() => setIdx((p) => Math.min(items.length-1, p+1))}>Next ▶</button>
</div>
</div>
</section>
);
}