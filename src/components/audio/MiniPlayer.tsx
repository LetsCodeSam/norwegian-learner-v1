import React from 'react';
import { AudioCtx } from './AudioProvider';

export function MiniPlayer() {
  const { stop } = React.useContext(AudioCtx);
  return (
    <div className="fixed bottom-2 inset-x-0">
      <div className="mx-auto max-w-md bg-white border shadow rounded-full px-3 py-2 flex items-center gap-2">
        <button className="px-2 py-1 rounded border" title="Prev">⏮</button>
        <button className="px-2 py-1 rounded border" title="Play/Pause">▶/⏸</button>
        <button className="px-2 py-1 rounded border" title="Next">⏭</button>
        <button className="ml-auto px-2 py-1 rounded border" onClick={stop} title="Stop">■</button>
      </div>
    </div>
  );
}
