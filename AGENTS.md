# AGENTS.md

## Stack

React 19 + TypeScript 6 + Vite 8 · Tailwind CSS v4 (`@tailwindcss/vite`, no `tailwind.config.js`) · oxfmt / oxlint · Zustand 5 (`src/store/chessStore.ts`) · TanStack Router file-based (`src/routes/`).

## Commands

```
pnpm dev          # dev server + TanStack Router codegen
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc -b --noEmit
pnpm lint         # oxlint
pnpm fmt          # oxfmt (auto-fix)
pnpm test         # vitest run
pnpm check        # fmt:check && typecheck && lint && test  ← validation gate
```

Tests use **Vitest** (`jsdom`). Import from `"vitest"` explicitly.

## Key Patterns

- **`cn()`** — use `src/lib/cn.ts` (clsx + tailwind-merge) for conditional classes.
- **Board sizing** — driven by `--sq-size` / `--board-size` CSS vars in `src/index.css`; use `style={{ width: "var(--sq-size)" }}`, not Tailwind, for these tokens.
- **Board square classes** — `sq-light`, `sq-dark`, `sq-selected`, `sq-last-move`, `sq-in-check`, `legal-dot`, `legal-ring`, `animate-blink`, `animate-pulse-border`, `animate-pulse-opacity` are plain CSS classes in `src/index.css`.
- **Engine layer** — `src/lib/engine/v1/minimaxEngine.ts` (minimax + web worker) and `src/lib/engine/v2/stockfish.ts` (Stockfish UCI + web worker) both implement the `Engine` interface from `src/lib/engine/index.ts`. Use `getEngine(version)` factory.
- **Web Workers** — minimax spawns via `new Worker(new URL('./minimaxWorker.ts', import.meta.url), { type: 'module' })`; Stockfish loads from `public/stockfish/`. One message in-flight at a time; stale responses discarded via `msgId`/`pendingMsgId` counters in the store.
- **Zustand store** — all game state in `src/store/chessStore.ts`. `game` (Chess.js) and counters are module-level vars, not Zustand state. Use `useChessStore` in React, `getChessState()` outside React.
- **TanStack Router** — `src/routeTree.gen.ts` is auto-generated, do not edit. Route guards check `getChessState().gameStarted` and redirect to `/` if false.
- **Path aliases** — `@/` → `src/`. Always use it for non-relative imports.
- **`verbatimModuleSyntax: true`** — type-only imports must be `import type { ... }`.
- **`erasableSyntaxOnly: true`** — no `enum` or `namespace`; use `const` maps.
- **`noUnusedLocals/Params`** — prefix intentionally unused with `_`.
- **Import order (oxfmt)** — external types → external values → internal types → internal values → relative types → relative values.
- **Plans** — live in `.plans/NN-kebab-name.md`; ignore when syncing docs.
- **Pawn promotion** — always auto-queen (`promotion: "q"`).

## Architecture

```
main.tsx
  └─ RouterProvider
       ├─ src/routes/__root.tsx     (root layout)
       ├─ src/routes/index.tsx      (/ — setup: engine/mode/color/difficulty → resetGame() → navigate)
       ├─ src/routes/v1/game.tsx    (/v1/game — Minimax)
       └─ src/routes/v2/game.tsx    (/v2/game — Stockfish)
                │
                └─ GameLayout (src/components/GameLayout.tsx) ← useChessStore
                        ├─ Board.tsx
                        ├─ Sidebar.tsx
                        └─ StatusBar.tsx
```

`src/types.ts` — shared types and constants (`DEPTH_MAP`, `ELO_MAP`, `MOVETIME_MAP`, `GameStatus`).
