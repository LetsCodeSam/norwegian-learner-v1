import React from 'react';

type Props = {
  text: string;
  onWord?: (w: string) => void;
  className?: string;
};

// Unicode-aware word matcher: letters + combining marks + common word punctuation
// Works for Norwegian (å/æ/ø, Å/Æ/Ø) and other Latin diacritics.
const WORD_RE = /\p{L}[\p{L}\p{M}’'\-]*/gu;

export function ClickableText({ text, onWord, className }: Props) {
  const nodes: React.ReactNode[] = [];
  let last = 0;

  for (const m of text.matchAll(WORD_RE)) {
    const start = m.index ?? 0;
    const word = m[0];

    // Push any plain text between matches as-is
    if (start > last) nodes.push(<span key={`t${last}`}>{text.slice(last, start)}</span>);

    // Clickable word (use original spelling)
    nodes.push(
      <button
        key={`w${start}`}
        type="button"
        lang="no"                               // help shaping/AT
        className="underline decoration-dotted underline-offset-2 hover:decoration-2 focus:outline-none"
        onClick={() => onWord?.(word)}
      >
        {word}
      </button>
    );

    last = start + word.length;
  }

  // Tail after the last match
  if (last < text.length) nodes.push(<span key={`t${last}`}>{text.slice(last)}</span>);

  return <span className={className}>{nodes}</span>;
}

export default ClickableText;
