import React from 'react';
import { AudioCtx } from '../../audio/AudioProvider';


export function VerbsTableBlock({ block }: { block: any }) {
const { speakNow } = React.useContext(AudioCtx);
const headers = ['inf','pres','pret','perf','fut'];
return (
<div className="overflow-x-auto">
<table className="min-w-full border bg-white rounded-2xl overflow-hidden">
<thead className="bg-gray-50 sticky top-0">
<tr>
<th className="text-left p-2">Infinitiv</th>
<th className="text-left p-2">Presens</th>
<th className="text-left p-2">Preteritum</th>
<th className="text-left p-2">Perfektum</th>
<th className="text-left p-2">Futur</th>
</tr>
</thead>
<tbody>
{block.verbs.map((v: any, i: number) => (
<tr key={i} className="border-t">
{headers.map((h) => (
<td key={h} className="p-2">
<button className="underline decoration-dotted hover:decoration-solid" onClick={() => speakNow(v[h])} title="Play">
{v[h]}
</button>
</td>
))}
</tr>
))}
</tbody>
</table>
</div>
);
}