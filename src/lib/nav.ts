export type Category = 'listening' | 'describe' | 'conversation' | 'other';

export function getCategoryFromPath(path: string): Category {
  const m = path.match(/^\/data\/(listening|describe|conversation)\//i);
  return (m?.[1]?.toLowerCase() as Category) || 'other';
}