export function ImageBlock({ block }: { block: any }) {
  if (!block?.src) return null;
  const src = `/${String(block.src).replace(/^\/?/, '')}`;
  return (
    <figure className="rounded-2xl overflow-hidden shadow border bg-white">
      <img src={src} alt={block.alt || 'lesson image'} className="w-full object-cover" />
      {block.caption && (<figcaption className="p-2 text-sm text-gray-700">{block.caption}</figcaption>)}
    </figure>
  );
}