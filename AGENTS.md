# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Stack

React 19 + TypeScript 6 + Vite 8, styled with **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no `tailwind.config.js`) and formatted/linted with **oxfmt** / **oxlint**.

## Commands

```
pnpm dev          # dev server
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc -b --noEmit
pnpm lint         # oxlint (react + typescript + oxc plugins)
pnpm fmt          # oxfmt (auto-fix)
pnpm fmt:check    # check formatting without writing
```

No test framework is set up — there are no tests.

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
- **Web Worker** — the AI engine runs in `src/engine/chessWorker.ts` spawned via `new Worker(new URL('../engine/chessWorker.ts', import.meta.url), { type: 'module' })`. Vite handles this natively (`worker.format: "es"` in `vite.config.ts`). Only one message is in-flight at a time; stale responses are discarded via a monotonic `msgId`.
- **`verbatimModuleSyntax: true`** — all type-only imports must use `import type { ... }`, not `import { type ... }`.
- **`erasableSyntaxOnly: true`** — TypeScript `enum` and namespace declarations are forbidden; use `const` object maps instead (see `DEPTH_MAP` in `src/types.ts`).
- **`noUnusedLocals` / `noUnusedParameters`** — the compiler rejects unused variables and parameters; prefix with `_` if intentionally unused.

## Architecture

```
App.tsx  ──→  useChessGame (src/hooks/)   ←── chessWorker (src/engine/)
               │                                     │
               ├─ Board.tsx                          └─ minimax.ts
               ├─ Sidebar.tsx
               ├─ StatusBar.tsx
               └─ SetupScreen.tsx
```

- All game state lives in `useChessGame`; components are purely presentational.
- `src/types.ts` is the single source of truth for shared types and constants (`DEPTH_MAP`, `GameStatus`, etc.).
- Pawn promotion is always auto-promoted to queen (`promotion: "q"`).
