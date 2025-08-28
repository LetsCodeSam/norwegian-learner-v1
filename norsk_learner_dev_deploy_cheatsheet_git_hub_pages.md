# Norsk Learner — Dev & Deploy Cheatsheet (GitHub Pages)

A quick, practical README for running, maintaining, and deploying the app via **GitHub Pages**.

---

## What this is
A responsive web app to learn Norwegian Bokmål. It supports **audio playback** (Web Speech API), **female voice autodetect**, **rate control**, **show/hide pronunciation & English**, **dark mode**, and JSON‑driven content.

Live site: `https://LetsCodeSam.github.io/norwegian-learner-v1/`

---

## Run locally
```bash
npm install
npm run dev
# open the printed localhost URL
```

### Preview a production build
```bash
npm run build
npx vite preview
```

---

## Project structure (key bits)
```
public/
  data/                      # JSON datasets (fetchable at /data/...)
    navigation.json
    listening/normalday.json
    describe/mai.json
    conversation/school.json
  assets/describe/*.png      # images referenced by JSON (optional)
src/
  components/
    audio/                   # AudioProvider, MiniPlayer
    lesson/                  # LessonPage + Blocks (Lines, Q&A, Monolog, Verbs)
    nav/                     # Home, NavIndex
    theme/                   # ThemeProvider, ThemeToggle (dark mode)
  lib/                       # fetchJSON, lang utilities
  styles/index.css           # Tailwind entry + theme base colors
vite.config.ts               # base path for GH Pages
```

---

## Data format & paths
- Place all JSON under `public/data/` — files here are served as `/data/...`.
- Use **absolute** paths in `navigation.json` (e.g. `"/data/describe/mai.json"`).
- Each dataset may declare `meta.cefr` (e.g., `A1`, `A2`); the **Home** screen shows a level filter.

---

## Audio notes
- Uses the browser’s **SpeechSynthesis** voices.
- App tries to pick a **Norwegian (no-NO / nb-NO / nn-NO) female** voice by name; user can override.
- Rate, pitch, voice, and visibility toggles persist in `localStorage`.

---

## Styling & Dark mode
- Tailwind configured with `darkMode: 'class'`.
- A small inline script in `index.html` applies the theme **before React mounts** to avoid flash.
- `ThemeProvider` cycles **Light → Dark → System** and persists to `localStorage.theme`.

---

## Deploy to GitHub Pages (branch method)
**One‑time:** set the Vite base to the repo name in `vite.config.ts`:
```ts
// vite.config.ts
export default defineConfig({
  base: '/norwegian-learner-v1/'
})
```

Then build and publish the `dist/` folder to the **`gh-pages`** branch:
```bash
npm run build
# SPA fallback to support deep links (404 → index.html)
node -e "require('fs').copyFileSync('dist/index.html','dist/404.html')"
# publish dist/ to the gh-pages branch
npx gh-pages -d dist -b gh-pages --dotfiles
```

Finally in GitHub → **Settings → Pages**: **Source:** *Deploy from a branch* → **Branch:** `gh-pages` / **Folder:** `/ (root)`.

Your site: `https://LetsCodeSam.github.io/norwegian-learner-v1/`.

> Keep `dist/` in `.gitignore` — you don’t commit build artifacts.

**Optional package.json scripts**
```jsonc
{
  "scripts": {
    "build": "vite build",
    "postbuild": "node -e \"require('fs').copyFileSync('dist/index.html','dist/404.html')\"",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist -b gh-pages --dotfiles"
  }
}
```
Then deploy with `npm run deploy`.

---

## Deploy with GitHub Actions (optional)
Switch Pages **Source** to **GitHub Actions** and add `.github/workflows/pages.yml`:
```yaml
name: Deploy Vite to GitHub Pages
on:
  push:
    branches: [ main ]
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: node -e "require('fs').copyFileSync('dist/index.html','dist/404.html')"
      - uses: actions/upload-pages-artifact@v3
        with: { path: 'dist' }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
> Use **one** method (Branch *or* Actions) to avoid race conditions.

---

## Troubleshooting
- **404s for `/src/main.tsx`** → You deployed a dev `index.html`. Rebuild and publish `dist/`.
- **Paths wrong on GH Pages** → `vite.config.ts` must use `base: '/norwegian-learner-v1/'` and `fetchJSON` should prefix `import.meta.env.BASE_URL` (already implemented).
- **Stuck/duplicate deployments** → Cancel older *pages-build-deployment* runs or add `concurrency` to the workflow.
- **Old service worker** → DevTools → Application → Service Workers → *Unregister*.

---

## Next up
- Keyboard shortcuts: **Space** (play/pause), **J/K** (prev/next), **M** (stop).
- Offline cache (PWA) with proper protocol guards.
- More datasets + images (drop in `public/data/...`).

