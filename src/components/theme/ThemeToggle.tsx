import { useContext } from 'react';
import { ThemeCtx } from './ThemeProvider'


export default function ThemeToggle() {
const { theme, setTheme } = useContext(ThemeCtx);
const cycle = () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
const label = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';
const icon = theme === 'light' ? '🌞' : theme === 'dark' ? '🌙' : '🖥️';
return (
<button
onClick={cycle}
title={`Theme: ${label} (click to change)`}
className="px-2 py-1 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-black"
>
<span className="mr-1">{icon}</span>{label}
</button>
);
}


/* App.tsx imports — make sure these match your file locations exactly:
import { ThemeProvider } from './components/theme/ThemeProvider';
import ThemeToggle from './components/theme/ThemeToggle';
*/