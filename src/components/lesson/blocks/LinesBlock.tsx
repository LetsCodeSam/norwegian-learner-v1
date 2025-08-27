import React from 'react';
import { AudioCtx } from '../../audio/AudioProvider';
import { ClickableText } from '../../common/ClickableText';

export function LinesBlock({ block }: { block: any }) {
  const { state, queuePlay, speakNow } = React.useContext(AudioCtx);
  return (
    <section className="space-y-3">
      {block.items.map((row: any, idx: number) => (
        <div key={idx} className="p-3 rounded-2xl shadow border bg-white">
          <div className="flex items-start justify-between gap-2">
            <div className="text-lg">
              <ClickableText text={row.no} onWord={(w) => speakNow(w)} />
            </div>
            <button className="px-3 py-1 rounded-xl border shadow" onClick={() => queuePlay(row.no)}>▶</button>
          </div>
          {state.showPron && (<div className="text-sm text-gray-600 mt-1">{row.pron}</div>)}
          {state.showEN && (<div className="text-sm text-gray-800 mt-1">{row.en}</div>)}
        </div>
      ))}
    </section>
  );
}