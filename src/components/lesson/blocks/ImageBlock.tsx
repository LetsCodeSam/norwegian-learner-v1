// File: src/components/lesson/blocks/ImageBlock.tsx
import type { JSX } from 'react';

// convert "assets/describe/pic.png" -> "<BASE>/assets/describe/pic.png"
// leaves absolute http(s) URLs untouched
function toPublicUrl(path: string = ''): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path; // external URL
  const base = (import.meta as any).env?.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

// Named export
export function ImageBlock({ block }: { block: any }): JSX.Element {
  const src = toPublicUrl(block?.src);
  const alt = block?.alt || '';
  const caption = block?.caption;

  return (
    <figure className="rounded-2xl border bg-white dark:bg-neutral-900 dark:border-neutral-700 shadow overflow-hidden">
      <img src={src} alt={alt} loading="lazy" className="w-full h-auto block" />
      {caption && (
        <figcaption className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// Default export too
export default ImageBlock;
