import React from 'react';
import { AudioCtx } from '../../audio/AudioProvider';
import { ClickableText } from '../../common/ClickableText';


export function QAListBlock({ block }: { block: any }) {
const { state, speakNow } = React.useContext(AudioCtx);
return (
<section className="space-y-3">
{block.items.map((q: any, i: number) => (
<details key={i} className="rounded-2xl bg-white border shadow">
<summary className="cursor-pointer p-3 text-base">
<ClickableText text={q.noQ} onWord={(w) => speakNow(w)} />
</summary>
<div className="px-3 pb-3 space-y-2">
<div><strong>Svar:</strong> <ClickableText text={q.noA} onWord={(w) => speakNow(w)} /></div>
{state.showPron && (<div className="text-sm text-gray-600">{q.pronA}</div>)}
{state.showEN && (<div className="text-sm">{q.enA}</div>)}
</div>
</details>
))}
</section>
);
}