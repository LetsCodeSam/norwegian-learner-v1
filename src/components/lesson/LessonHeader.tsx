import { useContext, useEffect, useState } from 'react';
import { AudioCtx } from '../audio/AudioProvider';


export function LessonHeader() {
const { state, setState } = useContext(AudioCtx);
const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);


useEffect(() => {
const load = () => setVoices(window.speechSynthesis.getVoices());
load();
window.speechSynthesis.onvoiceschanged = load;
return () => { (window.speechSynthesis as any).onvoiceschanged = null; };
}, []);


const voiceOptions = voices.filter(v => ['no-NO','nb-NO','nn-NO'].includes(v.lang));


return (
<div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
<div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3 px-3 py-2">
<label className="flex items-center gap-2 text-sm font-medium text-gray-800">
<input
type="checkbox"
className="h-4 w-4 accent-black"
checked={state.showPron}
onChange={(e)=>setState(s=>({...s, showPron: e.target.checked}))}
/>
PRON
</label>
<label className="flex items-center gap-2 text-sm font-medium text-gray-800">
<input
type="checkbox"
className="h-4 w-4 accent-black"
checked={state.showEN}
onChange={(e)=>setState(s=>({...s, showEN: e.target.checked}))}
/>
EN
</label>


<div className="ml-auto flex items-center gap-3">
<label className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
Rate
<select
className="min-w-[5rem] rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
value={state.rate}
onChange={(e)=>setState(s=>({...s, rate: Number(e.target.value)}))}
>
{[0.8, 0.9, 1.0, 1.1, 1.2].map(r => (
<option key={r} value={r}>{r.toFixed(1)}x</option>
))}
</select>
</label>


<label className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
Voice
<select
className="min-w-[16rem] rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
value={state.voiceName || ''}
onChange={(e)=>setState(s=>({...s, voiceName: e.target.value}))}
>
<option value="">(Auto Norwegian Female)</option>
{voiceOptions.map(v => (
<option key={v.name} value={v.name}>{v.name}</option>
))}
</select>
</label>
</div>
</div>
</div>
);
}


// 2) Slightly darken card borders and text for readability
// (optional) tweak LinesBlock container classes
// File: src/components/lesson/blocks/LinesBlock.tsx
// Replace container div classes:
// <div key={idx} className="p-3 rounded-2xl shadow border bg-white">
// with a higher-contrast border & text:
// <div key={idx} className="p-4 rounded-2xl shadow border border-gray-300 bg-white text-gray-900">


// 3) Ensure body background is light and consistent
// File: src/styles/index.css
// body { @apply bg-gray-100 text-gray-900; }


// 4) If you want even clearer focus states globally, add this to index.css:
// .focus-ring { @apply focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white; }
// Then add className="focus-ring" to interactive elements as needed.