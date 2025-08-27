import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';


type Theme = 'light' | 'dark' | 'system';


export const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; isDark: boolean }>({
theme: 'system',
setTheme: () => {},
isDark: false,
});


function applyTheme(theme: Theme) {
const root = document.documentElement; // <html>
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const dark = theme === 'dark' || (theme === 'system' && systemDark);
root.classList.toggle('dark', dark);
}


export function ThemeProvider({ children }: { children: ReactNode }) {
const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');


useEffect(() => {
try {
localStorage.setItem('theme', theme);
applyTheme(theme);
} catch {}
}, [theme]);


useEffect(() => {
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const handler = () => { if (theme === 'system') applyTheme('system'); };
mq.addEventListener?.('change', handler);
return () => mq.removeEventListener?.('change', handler);
}, [theme]);


const isDark = useMemo(() => document.documentElement.classList.contains('dark'), [theme]);


return <ThemeCtx.Provider value={{ theme, setTheme, isDark }}>{children}</ThemeCtx.Provider>;
}