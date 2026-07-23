# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Planning

When asked to plan a feature, write the plan as a Markdown file in `docs/plans/`. Use a short kebab-case filename that describes the feature (e.g. `docs/plans/game-mode-chooser.md`). Do not place plan files in the project root or anywhere else.

## Architectural Constraints

- **Single hook, pure components** — all game state and worker communication is centralised in `useChessGame`. Architectural proposals that distribute state into components or introduce a state manager must preserve this boundary.
- **Worker is long-lived** — one worker is spawned at mount and reused for every move (not re-spawned per move). Stale responses are filtered by a module-level monotonic `msgId`; resetting the game bumps `msgId`, not the worker.
- **`Board.tsx` is the only component that constructs a `Chess` instance** — it creates a read-only instance from the passed FEN solely for piece lookup. No other component or utility outside `useChessGame` and `src/engine/` should instantiate `Chess`.
- **Engine is fully FEN-based** — `getBestMove(fen, depth)` accepts a FEN string and reconstructs `Chess` internally. This is deliberate so the engine has no React/DOM dependency and is safe to import in a Web Worker.
- **Tailwind v4 with no config file** — adding a theme token requires editing `src/index.css` with `@theme`, not a config file.
- **No build-time code generation or path aliases** — `tsconfig.app.json` has no `paths`; imports use relative paths. Do not propose path alias changes without updating the tsconfig.
- **Depth map is the only difficulty abstraction** — `DEPTH_MAP` in `src/types.ts` maps difficulty to minimax depth. Difficulty does not affect evaluation, only search depth.
- **`verbatimModuleSyntax` + `erasableSyntaxOnly`** — any design involving enums, namespaces, or merged `import { type X, value }` syntax will fail to compile and must be avoided.
