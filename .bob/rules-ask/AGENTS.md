# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-Obvious Context

- **Tailwind v4** — there is no `tailwind.config.js`. Configuration (theme tokens) is done inside `src/index.css` with `@theme { … }`. The standard Tailwind docs for v3 config files do not apply.
- **Board square CSS classes are global** — `sq-light`, `sq-dark`, `sq-selected`, `sq-last-move`, `sq-in-check`, `legal-dot`, `legal-ring` are plain global CSS classes in `src/index.css`, not Tailwind utilities. Searching for them in component files will not reveal their definitions.
- **CSS custom properties drive layout** — `--board-size` and `--sq-size` control all board/square dimensions. The responsive breakpoints in `src/index.css` (740 px, 480 px) only override these two variables.
- **No test files exist** — there is no test framework configured. `pnpm test` does not exist; validation is `fmt:check + typecheck + lint`.
- **`chessboard-plan.md`** — the root-level plan file contains the full sub-task breakdown and dependency order; it is the canonical reference for the intended architecture.
- **`src/types.ts` is the sole shared-types module** — all cross-component types (`PieceColor`, `PieceType`, `Difficulty`, `GameStatus`, `CapturedPieces`, `LastMove`) and the `DEPTH_MAP` constant live here, not scattered across files.
- **oxfmt handles both formatting and import sorting** — it is not Prettier. Configuration is in `.oxfmtrc.json`; the `sortTailwindcss` section means class order inside `cn()` / `clsx()` is automatically normalised against `src/index.css`.
