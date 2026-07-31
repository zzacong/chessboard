# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Doc Maintenance

**Keep this file current.** Whenever tooling, scripts, or stack configuration changes — e.g. adding a package, changing a `pnpm` script, adding a test framework, updating a tsconfig option — check whether any section of `AGENTS.md` is now stale and update it in the same commit/task. Common triggers:

> **Plans** live in `.plans/` as `NN-kebab-name.md` (e.g. `.plans/08-my-feature.md`). Ignore all files under `.plans/` when syncing docs — they contain historical or completed work.

- `package.json` scripts added, renamed, or removed → update **Commands**
- New dev dependency that affects workflow (linter, formatter, test runner, bundler) → update **Stack** and **Commands**
- `tsconfig*.json` compiler option changes → update relevant **Key Patterns** bullets
- Architecture changes (new files, new hooks, renamed components) → update **Architecture**
- New project-wide conventions or patterns → add a **Key Patterns** bullet

## Stack

React 19 + TypeScript 6 + Vite 8, styled with **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no `tailwind.config.js`) and formatted/linted with **oxfmt** / **oxlint**. State managed with **Zustand 5** (`src/store/chessStore.ts`). Client-side routing via **TanStack Router** (file-based, `src/routes/`).

## Commands

```
pnpm dev              # dev server (also runs TanStack Router codegen)
pnpm build            # tsc -b && vite build
pnpm preview          # preview the production build
pnpm typecheck        # tsc -b --noEmit
pnpm lint             # oxlint (react + typescript + oxc plugins)
pnpm fmt              # oxfmt (auto-fix)
pnpm fmt:check        # check formatting without writing
pnpm test             # vitest run (single pass)
pnpm test:watch       # vitest (watch mode)
pnpm check            # fmt:check && typecheck && lint && test (full validation gate)
```

Tests use **Vitest** with `jsdom` environment. Import test APIs explicitly from `"vitest"` — e.g. `import { describe, it, expect } from "vitest"`. The validation gate is `pnpm check` (or individually: `pnpm fmt:check && pnpm typecheck && pnpm lint && pnpm test`).

## Import Order (enforced by oxfmt)

oxfmt auto-sorts imports into this exact group order:

1. `type` imports (external)
2. value builtin + external
3. `type` internal
4. value internal
5. `type` relative (parent / sibling / index)
6. value relative (parent / sibling / index)

Within components, type imports from `chess.js` precede value imports; internal type imports precede internal value imports.

## Key Patterns

- **`cn()` utility** — always use `src/lib/cn.ts` (clsx + tailwind-merge) for conditional class names. oxfmt sorts Tailwind classes inside `cn()` and `clsx()` calls automatically against `src/index.css`.
- **CSS custom properties for board sizing** — board square dimensions are driven by `--sq-size` / `--board-size` CSS variables defined in `src/index.css`; use `style={{ width: "var(--sq-size)" }}` rather than Tailwind for anything that depends on these tokens.
- **Board square classes live in `src/index.css`** — `sq-light`, `sq-dark`, `sq-selected`, `sq-last-move`, `sq-in-check`, `legal-dot`, `legal-ring`, `animate-blink`, `animate-pulse-border`, `animate-pulse-opacity` are plain CSS classes (not Tailwind utilities) because Tailwind can't express dynamic CSS-var values.
- **Engine layer** — two engine implementations exist side-by-side: `src/lib/engine/v1/minimaxEngine.ts` (minimax, web worker) and `src/lib/engine/v2/stockfish.ts` (Stockfish UCI, web worker). Both implement the shared `Engine` interface defined in `src/lib/engine/index.ts`, which also exports `EngineOptions` and the `getEngine(version)` factory. The store always calls `getEngine(engineVersion)`.
- **Web Workers** — the minimax engine spawns its worker via `new Worker(new URL('./minimaxWorker.ts', import.meta.url), { type: 'module' })` inside `MinimaxEngine`; Stockfish loads a pre-built JS blob from `public/stockfish/`. Workers are instantiated lazily on first call to the singleton getter. Only one message is in-flight at a time; stale responses are discarded via module-level `msgId` / `pendingMsgId` counters in the store.
- **Zustand store** — all game state lives in `src/store/chessStore.ts`. The Chess.js instance (`game`) and `msgId`/`pendingMsgId` counters are module-level variables (not Zustand state) because they don't need to trigger re-renders. Use `useChessStore` (React hook) or `getChessState()` (outside React, e.g. route guards) to read state.
- **TanStack Router** — routing is file-based under `src/routes/`. Route types are auto-generated into `src/routeTree.gen.ts` by the `@tanstack/router-plugin` Vite plugin on `pnpm dev`. Both `/v1/game` and `/v2/game` have a `beforeLoad` guard that checks `getChessState().gameStarted` and redirects to `/` if the game has not been started.
- **Path aliases** — `@/` maps to `src/` (configured via `resolve.tsconfigPaths` in `vite.config.ts`). Always use `@/` for non-relative imports within `src/`.
- **`verbatimModuleSyntax: true`** — all type-only imports must use `import type { ... }`, not `import { type ... }`.
- **`erasableSyntaxOnly: true`** — TypeScript `enum` and namespace declarations are forbidden; use `const` object maps instead (see `DEPTH_MAP` in `src/types.ts`).
- **`noUnusedLocals` / `noUnusedParameters`** — the compiler rejects unused variables and parameters; prefix with `_` if intentionally unused.

## Architecture

```
main.tsx
  └─ RouterProvider
       ├─ src/routes/__root.tsx      (root layout — <Outlet />)
       ├─ src/routes/index.tsx       (/ — setup UI: engine/mode/color/difficulty pickers)
       ├─ src/routes/v1/game.tsx     (/v1/game — Minimax; beforeLoad guard → redirects to / if !gameStarted)
       └─ src/routes/v2/game.tsx     (/v2/game — Stockfish; beforeLoad guard → redirects to / if !gameStarted)
                │
                └─ GameLayout (src/components/GameLayout.tsx)  ←── useChessStore (src/store/chessStore.ts)
                        │                                                    │
                        ├─ Board.tsx                   ┌──── lib/engine/index.ts (getEngine) ────┐
                        ├─ Sidebar.tsx            v1/minimaxEngine.ts              v2/stockfish.ts
                        └─ StatusBar.tsx               │
                                                 v1/minimaxWorker.ts
                                                 v1/minimax.ts
```

- All game state lives in the Zustand store (`src/store/chessStore.ts`); components subscribe directly to the slices they need via `useChessStore(selector)`.
- `src/routes/index.tsx` owns the full setup UI (engine version, mode, color, difficulty pickers). On start it calls `resetGame(...)` then navigates to `/v1/game` or `/v2/game` depending on the chosen engine.
- `GameLayout` (`src/components/GameLayout.tsx`) is the shared game UI shell (header, board, sidebar). It receives a `badge` string (e.g. `"v1 · Minimax"`) from the route component and exposes a "New Game" action that navigates back to `/`.
- `src/routeTree.gen.ts` is generated automatically — do not edit by hand.
- `src/types.ts` is the single source of truth for shared types and constants (`DEPTH_MAP`, `SKILL_MAP`, `GameStatus`, etc.).
- Pawn promotion is always auto-promoted to queen (`promotion: "q"`).
