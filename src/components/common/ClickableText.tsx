
export function ClickableText({ text, onWord }: { text: string; onWord: (w: string) => void }) {
  if (!text) return null as any;
  const tokens = text.match(/\b[^\s]+\b|\s+|[.,!?;:]/g) || [text];
  return (
    <span className="leading-relaxed">
      {tokens.map((tk, i) => {
        const isWord = /\S/.test(tk) && !/[.,!?;:]/.test(tk) && !/^\s+$/.test(tk);
        if (!isWord) return <span key={i}>{tk}</span>;
        return (
          <button key={i} className="inline px-0.5 underline decoration-dotted hover:decoration-solid focus:outline-none" onClick={() => onWord(tk)} title="Play word">
            {tk}
          </button>
        );
      })}
    </span>
  );
}