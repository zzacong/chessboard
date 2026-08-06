# AGENTS.md

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS v4 (`@tailwindcss/vite` — no `tailwind.config.js`) · Zustand 5 · TanStack Router (file-based) · oxlint / oxfmt · Vitest (`jsdom`).

## Commands

`pnpm check` is the validation gate (`fmt:check && typecheck && lint && test`) — run it before every commit.

Vitest: import from `"vitest"` explicitly.

## Architecture

```
main.tsx
  └─ RouterProvider
       ├─ src/routes/__root.tsx     (root layout)
       ├─ src/routes/index.tsx      (/ — setup screen → resetGame() → navigate)
       ├─ src/routes/v1/game.tsx    (/v1/game — Minimax)
       └─ src/routes/v2/game.tsx    (/v2/game — Stockfish)
                │
                └─ GameLayout (src/components/GameLayout.tsx) ← useChessStore
                        ├─ Board.tsx
                        ├─ Sidebar.tsx
                        ├─ StatusBar.tsx
                        └─ ThemeToggle.tsx
```

- `src/routeTree.gen.ts` — auto-generated; never edit.
- Route guards read `getChessState().gameStarted` and redirect to `/` if false.
- `src/types.ts` — shared types and constants (`DEPTH_MAP`, `ELO_MAP`, `MOVETIME_MAP`).

## Store (`src/store/chessStore.ts`)

All game state lives here. `game` (Chess.js instance), `msgId`, and `pendingMsgId` are **module-level vars** — not Zustand state — so they never trigger re-renders.

- `useChessStore(selector)` — React hook.
- `getChessState()` — snapshot for non-React callers (route guards, engine callbacks).
- **Stale-guard** — engine responses are discarded by comparing `msgId` / `pendingMsgId` before applying.
- `difficultyBlack` — separate difficulty for the black engine in `computer-vs-computer` mode.

## Engine layer (`src/lib/engine/`)

Both engines implement `Engine` (`src/lib/engine/index.ts`). Always use `getEngine(version)` — never import engines directly.

- **v1** — minimax web worker.
- **v2** — Stockfish UCI, loads from `public/stockfish/`.

One message in-flight per engine; call `cancelSearch()` before every reset or undo.

## Key patterns

- **`cn()`** — `src/lib/cn.ts` (clsx + tailwind-merge) for conditional classes.
- **Board sizing** — `--sq-size` / `--board-size` CSS vars in `src/index.css`; use `style={{ width: "var(--sq-size)" }}`, not Tailwind, for these tokens.
- **Board square classes** — `sq-light`, `sq-dark`, `sq-selected`, `sq-last-move`, `sq-in-check`, `legal-dot`, `legal-ring`, `animate-blink`, `animate-pulse-border`, `animate-pulse-opacity` — plain CSS in `src/index.css`.
- **Pawn promotion** — always auto-queen (`promotion: "q"`).
- **Path aliases** — `@/` → `src/`. Use for all non-relative imports.

## TypeScript constraints

- `verbatimModuleSyntax: true` — type-only imports must use `import type { … }`.
- `erasableSyntaxOnly: true` — no `enum` or `namespace`; use `const` maps.
- `noUnusedLocals/Params` — prefix intentionally unused identifiers with `_`.

## Plans

Store in `.plans/NN-kebab-name.md` (two-digit prefix, next sequential number). Never overwrite an existing plan file.
