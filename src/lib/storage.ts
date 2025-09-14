export const storage = {
  get<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set<T>(key: string, v: T) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} },
};