# Norsk Learner — Wireframe v2

High‑level, implementation‑ready wireframe for the Bokmål learning app. Matches what we’ve built so far and adds the latest UX (search, level filter, dark mode, robust audio controls, special letters).

---

## 1) Screen map
- **App Shell** (sticky header + content area + mini player)
  - **Home** (search + level filter + dataset cards)
  - **Lesson** (title + tabs: *Lines*, *Q&A*, *Monolog*, *Verbs*)

---

## 2) Header (always visible)
**Layout:** Left: Home button. Right: Theme toggle. Below header: Lesson header controls (sticky within lesson)

- **Home (🏠)** — returns to Home grid.
- **Theme toggle** — cycles *Light → Dark → System*.
- **Lesson controls bar** *(visible on Lesson pages)*
  - **PRON** (checkbox) — show/hide pronunciation line.
  - **EN** (checkbox) — show/hide English translation line.
  - **Rate** (select: 0.8×, 0.9×, 1.0×, 1.1×, 1.2×).
  - **Voice** (select: auto Norwegian female by default; list nb‑NO/nn‑NO/no‑NO voices).

*Sticky behavior:* both the app header and lesson controls stay pinned while scrolling.

---

## 3) Home
**Controls row**
- **Search input** — tolerant to Norwegian letters via normalization (æ/ø/å handled; fuzzy token match).
- **Level filter** — *All, A1, A2, B1, B2, C1, C2, Unknown*. Populated by reading `meta.cefr` from each dataset JSON.

**Grid**
- **Card**: emoji → title → level. (No raw path shown.)
- **Click** opens `LessonPage(title, path)`.

**Responsive**
- ≤640px: 2‑col grid
- ≥640px: 3‑col grid
- Big touch targets (min 44×44), rounded‑2xl cards, subtle shadow.

---

## 4) Lesson Page
**Top**: Title + (under it) sticky **Lesson controls** (PRON/EN/Rate/Voice).

**Tabs**
- **Lines** (default)
  - List of sentence cards.
  - Row content per card:
    - **Norwegian text** (rich, keeps original diacritics: ø, æ, å).
    - **Pronunciation** line (toggleable) — syllable dots/hyphens allowed.
    - **English** line (toggleable).
    - **Play** icon button at right.
    - **Per‑word audio**: Norwegian words are clickable; plays that token.
- **Q&A** — question/answer blocks with per‑line play.
- **Monolog** — paragraph(s) with play per sentence.
- **Verbs** — compact table (Infinitive / Present / Past / Perfect), each cell plays the exact form.

**Mini Player** (floating bottom‑right, across app)
- Shows current utterance; **Play/Pause**, **Prev (J)**, **Next (K)**, **Stop (M)**, **Space** = play/pause.

**Empty/Errors**
- Graceful states if a section is missing.

---

## 5) Special letter handling (ø, æ, å)
- **Display:** original strings preserved everywhere.
- **Audio:** fed directly to speech synthesis; rate & voice applied.
- **Search:** `normalizeForSearch` maps diacritics → ASCII (æ→ae, ø→o, å→aa) and removes accents for tolerant matches.

---

## 6) Data model & flow
- **`public/data/navigation.json`** — tree of groups and datasets; dataset node:
  ```json
  { "type":"dataset", "label":"School", "emoji":"🏫", "path":"/data/conversation/school.json" }
  ```
- **Dataset JSON** — includes optional `meta.cefr` and sections for *lines*, *qa*, *monolog*, *verbs*.
- **Fetching** — `fetchJSON(path)` prepends `import.meta.env.BASE_URL` safely; all content under `public/` is served at `/...`.
- **GitHub Pages** — Vite `base` set to `/<repo>/`; absolute data paths `/data/...` resolve correctly in dev and prod.

---

## 7) State & persistence
- **AudioProvider (Context)**
  - `rate`, `voiceName`, `showPron`, `showEN`, current queue/index, playing state.
  - Persists to `localStorage` (so header choices survive reloads).
- **ThemeProvider (Context)**
  - `theme: 'light'|'dark'|'system'`, `isDark`.
  - Inline head script prevents flash, setting `.dark` on `<html>` before React mounts.

---

## 8) Accessibility & UX
- Keyboard support (Space, J/K, M)
- Focus rings on all interactive elements.
- Labels/`aria-*` for form controls; larger hit areas.
- High contrast in light/dark; sticky bars with `backdrop-blur`.

---

## 9) Not in scope (now)
- Practice mode / quizzes
- Analytics

---

## 10) Quick ASCII layouts
**Home**
```
┌───────────────────────────────────────── Header (Home • Theme) ──────────────┐
│ Norsk Learner                                                                │
│ [Search…………………]  Level [All ▾]                                            │
└──────────────────────────────────────────────────────────────────────────────┘
[ 📘 Normal Day  A2 ]  [ 🏞 Winter  A2 ]  [ 🧩 Exercise  A2 ]
[ 🏙 Mai 17  A2 ]      [ 🏫 School  A2 ]   … (2–3 columns)
```

**Lesson (Lines tab)**
```
┌──────────── Header ────────────┐
│ 🏠 Home                                 🌙 Theme                              │
├──────── Lesson Controls (sticky) ───────┤
│ [✓] PRON  [✓] EN  Rate [1.0× ▾]  Voice [(Auto Norwegian Female) ▾]          │
└─────────────────────────────────────────┘
• Jeg har en vanlig dag …                                     [▶]
  jæ har en VÅN-lig …
  I have a normal day …

• Om morgenen står jeg opp …                                  [▶]
  …
```

---

## 11) Component map (implementation)
- `App` → `ThemeProvider`, `AudioProvider`, `MiniPlayer`, Router‑ish state
- `Home` → search, level filter, dataset `Card`
- `LessonPage` → `LessonHeader`, `Tabs`, blocks: `LinesBlock`, `QAListBlock`, `MonologBlock`, `VerbsTableBlock`
- `AudioProvider` → queue mgmt, TTS, keyboard shortcuts
- `NavIndex` → `loadNav()`; `fetchJSON` helper; `lang` utils (normalize)

---

**This wireframe mirrors the current app; we can iterate if you want badges (e.g., section counts), pinned favorites, or a compact mobile header.**

