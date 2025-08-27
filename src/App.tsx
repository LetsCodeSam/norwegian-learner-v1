import React from 'react';
import { AudioProvider } from './components/audio/AudioProvider';
import { MiniPlayer } from './components/audio/MiniPlayer';
import { Home } from './components/nav/Home';
import { LessonPage } from './components/lesson/LessonPage';
import { ThemeProvider } from './components/theme/ThemeProvider';
import ThemeToggle from './components/theme/ThemeToggle';

export default function App() {
const [route, setRoute] = React.useState<{ page: 'home' } | { page: 'lesson'; title: string; path: string }>({ page: 'home' });
return (
<ThemeProvider>
<AudioProvider>
<div className="min-h-screen bg-gray-100 dark:bg-neutral-900 dark:text-gray-100">
<header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-gray-200 dark:border-neutral-800">
<div className="max-w-4xl mx-auto flex items-center gap-2 px-3 py-2">
<button className="px-2 py-1 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800" onClick={() => setRoute({ page: 'home' })}>🏠 Home</button>
<div className="ml-auto flex items-center gap-2">
<ThemeToggle />
</div>
</div>
</header>


{route.page === 'home' && (
<Home onOpen={(title, path) => setRoute({ page: 'lesson', title, path })} />
)}
{route.page === 'lesson' && (
<LessonPage title={route.title} path={route.path} />
)}


<MiniPlayer />
</div>
</AudioProvider>
</ThemeProvider>
);
}


/*import React from 'react';
import { AudioProvider } from './components/audio/AudioProvider';
import { MiniPlayer } from './components/audio/MiniPlayer';
import { Home } from './components/nav/Home';
import { LessonPage } from './components/lesson/LessonPage';


export default function App() {
const [route, setRoute] = React.useState<{ page: 'home' } | { page: 'lesson'; title: string; path: string }>({ page: 'home' });
return (
<AudioProvider>
<div className="min-h-screen bg-gray-100">
<header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
<div className="max-w-4xl mx-auto flex items-center gap-2 px-3 py-2">
<button className="px-2 py-1 rounded-xl border" onClick={() => setRoute({ page: 'home' })}>🏠 Home</button>
<div className="ml-auto text-sm">Norwegian Bokmål — Female voice (auto)</div>
</div>
</header>


{route.page === 'home' && (
<Home onOpen={(title, path) => setRoute({ page: 'lesson', title, path })} />
)}


{route.page === 'lesson' && (
<LessonPage title={route.title} path={route.path} />
)}


<MiniPlayer />
</div>
</AudioProvider>
);
} */