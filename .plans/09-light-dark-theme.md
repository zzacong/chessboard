# Plan: Light & Dark Theme Support

## Overview

Add a toggleable light/dark theme to the chess app. The current dark theme is a warm obsidian aesthetic (near-black browns, gold accent). The light theme mirrors this warmth from the other direction — warm parchment/linen backgrounds using the same brown/gold family. This is intentional: light and dark sides of the chess board applied to the UI itself.

**Approach:** CSS custom properties already gate all colours. We introduce a `data-theme` attribute on `<html>`, define a `[data-theme="light"]` override block in CSS, and add a Zustand slice + localStorage persistence for the preference. A minimal sun/moon toggle lands in the header on both the game page and the home page.

**No new dependencies.** Board square colours (`--sq-light`, `--sq-dark`, etc.) are canonical chess colours and stay the same on both themes.

**Confirmed decisions:**

1. Light palette — warm parchment (`#f5f0e8` bg), same brown/gold family as the board. ✅
2. Initial default — auto-detect `prefers-color-scheme`; fall back to `'dark'` only when system is also dark or unset. ✅
3. Flash prevention — inline `<script>` in `index.html` `<head>` reads localStorage + system pref and sets `data-theme` synchronously before first paint. ✅
4. Toggle placement — header (game page) + top-right corner (home page). ✅

---

## Sub-Tasks

---

### Sub-Task 1 — Define Light Theme Tokens in CSS

**Intent:** Define the warm-parchment light palette as a `[data-theme="light"]` override block in `src/index.css`, and make `color-scheme` theme-aware.

**Expected Outcomes:**

- A `[data-theme="light"]` rule block in `src/index.css` overrides all 11 UI colour vars.
- `html[data-theme="light"]` sets `color-scheme: light`.
- The existing dark defaults in `:root` and `@theme` remain unchanged.
- Hardcoded colour values in components (board border `#3a2510`, shadows `rgba(0,0,0,...)`, hover overlays) are extracted into new CSS vars (`--shadow-board`, `--shadow-overlay`, `--board-border`, `--header-bg`, `--inset-highlight`, `--last-move-bg`, `--piece-shadow`) so they can be overridden per theme.

**Light Palette (warm parchment / inverted chess board):**

| Token                | Dark value (current) | Light value |
| -------------------- | -------------------- | ----------- |
| `--color-bg`         | `#111010`            | `#f5f0e8`   |
| `--color-surface`    | `#1a1918`            | `#ede8de`   |
| `--color-surface-2`  | `#242220`            | `#e3ddd2`   |
| `--color-border`     | `#332f2c`            | `#c8b9a4`   |
| `--color-border-2`   | `#4a4440`            | `#b5a18a`   |
| `--color-text`       | `#f2ede8`            | `#1a1512`   |
| `--color-text-muted` | `#8a7f74`            | `#7a6855`   |
| `--color-accent`     | `#c8a05a`            | `#b07030`   |
| `--color-accent-2`   | `#d4a843`            | `#a06020`   |
| `--color-success`    | `#5a9e6e`            | `#3a7d50`   |
| `--color-danger`     | `#c0392b`            | `#b02818`   |

**New shared vars (dark defaults, light overrides):**

| Var                 | Dark default             | Light override           |
| ------------------- | ------------------------ | ------------------------ |
| `--board-border`    | `#3a2510`                | `#8a5a30`                |
| `--shadow-board`    | `rgba(0,0,0,0.7)`        | `rgba(80,50,20,0.22)`    |
| `--shadow-board-2`  | `rgba(0,0,0,0.4)`        | `rgba(80,50,20,0.12)`    |
| `--shadow-piece`    | `rgba(0,0,0,0.5)`        | `rgba(60,30,10,0.3)`     |
| `--header-bg`       | `rgba(17,16,16,0.92)`    | `rgba(237,232,222,0.92)` |
| `--inset-highlight` | `rgba(255,255,255,0.04)` | `rgba(255,255,255,0.6)`  |
| `--last-move-bg`    | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.04)`       |
| `--hover-overlay`   | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.07)`       |

**Todo List:**

1. In `src/index.css`, add all new shared vars (`--board-border`, `--shadow-board`, `--shadow-board-2`, `--shadow-piece`, `--header-bg`, `--inset-highlight`, `--last-move-bg`, `--hover-overlay`) to the `:root` block with dark defaults.
2. Add `[data-theme="light"]` rule overriding all 11 colour tokens + all 8 new vars.
3. Add `html { color-scheme: dark; }` stays as-is (dark default); add `html[data-theme="light"] { color-scheme: light; }`.
4. Add the light-theme accent to the `pulseBorder` keyframe (use CSS var) and `@theme` for `accent` — the `@theme` block stays dark because Tailwind compiles its own class values at build time; the runtime CSS var overrides do the work.

**Relevant Context:**

- `src/index.css` — all changes in this file
- `@theme` block (lines 3–15): Tailwind static class values — these need a note that Tailwind utility classes like `bg-accent` bake in the build-time value; `style={{ color: "var(--color-accent)" }}` and CSS-var-based classes will adapt, but pure Tailwind classes like `bg-accent/10` won't. Plan for this in later sub-tasks by auditing which uses must shift to inline `var()`.

**Status:** [x] done

---

### Sub-Task 2 — Add Theme State to Zustand Store

**Intent:** Store the theme preference (`'dark' | 'light'`) in Zustand and persist it to `localStorage` so it survives page reloads.

**Expected Outcomes:**

- `ChessState` has a `theme: 'dark' | 'light'` field.
- `ChessActions` has a `setTheme: (t: 'dark' | 'light') => void` action.
- On initialisation, the store reads `localStorage.getItem('chess-theme')` to hydrate the default (falling back to `'dark'`).
- `setTheme` writes to `localStorage` and calls `set({ theme })`.
- Add `Theme` type to `src/types.ts`.

**Todo List:**

1. Add `export type Theme = 'dark' | 'light'` to `src/types.ts`.
2. In `src/store/chessStore.ts`: import `Theme` type; add `theme: Theme` to `ChessState`; add `setTheme` to `ChessActions`.
3. In store initial state, read `(localStorage.getItem('chess-theme') as Theme | null) ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')`.
4. In `setTheme` action: call `set({ theme })` and `localStorage.setItem('chess-theme', theme)`.

**Relevant Context:**

- `src/types.ts` — add `Theme` type
- `src/store/chessStore.ts` — `ChessState` (line 72), `ChessActions` (line 91), initial state (lines 113–129)

**Status:** [x] done

---

### Sub-Task 3 — Sync `data-theme` to DOM & Fix Hardcoded Values in Components

**Intent:** Apply the `data-theme` attribute to `<html>` reactively, and replace all hardcoded colour values in components with the new CSS vars defined in Sub-Task 1.

**Expected Outcomes:**

- `src/routes/__root.tsx` subscribes to `theme` from the store and applies `document.documentElement.setAttribute('data-theme', theme)` in a `useEffect`.
- `src/components/Board.tsx` `GRID_STYLE` uses `var(--board-border)`, `var(--shadow-board)`, `var(--shadow-board-2)` instead of hardcoded hex/rgba.
- `PIECE_WRAPPER_SELECTED` uses `var(--shadow-piece)`.
- The hover overlay span uses `var(--hover-overlay)` instead of `bg-white/[0.12]`.
- `src/components/GameLayout.tsx` header `background` uses `var(--header-bg)`.
- `src/routes/index.tsx` setup card `boxShadow` uses the new shadow vars; `inset` highlight uses `var(--inset-highlight)`.
- `src/components/Sidebar.tsx` last-move row uses `var(--last-move-bg)` instead of `bg-white/[0.04]`.
- Tailwind utility classes that bake in dark-only colour (e.g. `bg-accent/10`, `border-accent`, `shadow-[0_0_0_1px_var(--color-accent)]`) are fine — they reference the CSS var at render time via the `var()` in the generated rule; the CSS var override in `[data-theme="light"]` will propagate correctly. Verify this holds; if Tailwind has baked in a hex literal instead of a `var()`, convert those usages to inline `style` or a dedicated CSS class.

**Todo List:**

1. `public/index.html` (or `index.html` at project root): add an inline `<script>` in `<head>` that reads `localStorage.getItem('chess-theme')` and, if absent, checks `window.matchMedia('(prefers-color-scheme: light)').matches`; sets `document.documentElement.setAttribute('data-theme', resolved)` synchronously. This runs before React mounts and eliminates any flash of the wrong theme.
2. `src/routes/__root.tsx`: import `useEffect` from React; import `useChessStore`; add `useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme])` in `RootComponent` to keep DOM in sync as the user toggles.
3. `src/components/Board.tsx`: update `GRID_STYLE` and `PIECE_WRAPPER_SELECTED` constants to use new CSS vars. Change hover overlay span from `bg-white/[0.12]` to `style={{ background: "var(--hover-overlay)" }}`.
4. `src/components/GameLayout.tsx`: change header `background` inline style to `var(--header-bg)`.
5. `src/routes/index.tsx`: change setup card `boxShadow` to use `var(--shadow-board)`, `var(--shadow-board-2)`, `var(--inset-highlight)`.
6. `src/components/Sidebar.tsx`: change last-move row class from `bg-white/[0.04]` to `style={{ background: "var(--last-move-bg)" }}` (remove the Tailwind class).

**Relevant Context:**

- `index.html` — root HTML file (flash-prevention script goes here)
- `src/routes/__root.tsx` (line 9 — `RootComponent`)
- `src/components/Board.tsx` (lines 22–34 — static style objects; line 130 — hover overlay)
- `src/components/GameLayout.tsx` (line 25 — header style)
- `src/routes/index.tsx` (lines 172–174 — card shadow)
- `src/components/Sidebar.tsx` (line 131 — last-move row)

**Status:** [x] done

---

### Sub-Task 4 — Add Theme Toggle to Header & Home Page

**Intent:** Place a minimal sun/moon icon toggle in the header (`GameLayout`) and the home page (`routes/index.tsx`) so users can switch themes from anywhere.

**Expected Outcomes:**

- A `ThemeToggle` component (`src/components/ThemeToggle.tsx`) renders a single `<button>` with an accessible label ("Switch to light theme" / "Switch to dark theme") and a sun ☀ / moon ☾ icon (unicode, no SVG dependency).
- The button style is consistent with the existing "New Game" button style — border, muted text, `12px`, hover transition.
- `GameLayout.tsx` renders `<ThemeToggle />` in the header between the flex spacer and the "New Game" button.
- `src/routes/index.tsx` renders `<ThemeToggle />` in the top-right corner of the page (absolute positioned within the outer wrapper).
- The toggle calls `setTheme(theme === 'dark' ? 'light' : 'dark')` from the store.

**Todo List:**

1. Create `src/components/ThemeToggle.tsx` — reads `theme` from store, renders accessible icon button.
2. In `src/components/GameLayout.tsx`, import and place `<ThemeToggle />` before the "New Game" button.
3. In `src/routes/index.tsx`, import and place `<ThemeToggle />` absolutely in the top-right corner of the page.

**Relevant Context:**

- `src/components/GameLayout.tsx` (lines 41–48 — header right side)
- `src/routes/index.tsx` (lines 133–138 — outer page wrapper)
- `src/lib/cn.ts` — use `cn()` for conditional classes
- `useChessStore` + `setTheme` action from Sub-Task 2

**Status:** [x] done

---

## Design Notes

### Palette rationale

Both themes share the same warm brown/gold DNA as the chess board itself. Dark: near-black walnut. Light: warm parchment. The accent shifts from gold `#c8a05a` to a richer burnt amber `#b07030` on light to maintain contrast. This is not a generic blue-accent light mode — it reads as the same product.

### What doesn't change

- Board square colours (`--sq-light`, `--sq-dark`, `--sq-selected`, `--sq-last-move`, etc.) — these are canonical chess colours and remain unchanged.
- Animation keyframes — no colour changes needed.
- Fonts, spacing, layout — purely a colour layer.

### Flash prevention

An inline `<script>` in `index.html`'s `<head>` (Sub-Task 3, step 1) sets `data-theme` synchronously — before any CSS is parsed and before React mounts — so the browser never paints with the wrong theme. The `useEffect` in `__root.tsx` then keeps it in sync as the user toggles during the session.

### System default detection

The Zustand store reads `localStorage` first (explicit user preference wins), then falls back to `window.matchMedia('(prefers-color-scheme: light)')`. The inline script in `index.html` uses the same two-step logic so the initial render always matches.

### Tailwind `@theme` vs runtime CSS vars

Tailwind v4 compiles `@theme` values into its utility classes at build time. However, Tailwind v4 actually emits `var(--color-*)` references in its output when you use custom tokens — so `bg-accent`, `text-text`, etc., will resolve against the runtime CSS var. This means `[data-theme="light"]` overrides will propagate through Tailwind utility classes correctly without any changes to the Tailwind build.
