# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Critical Coding Rules

- **`import type` is mandatory** — `verbatimModuleSyntax: true` means `import { type Foo }` is rejected; always write `import type { Foo }`.
- **No enums or namespaces** — `erasableSyntaxOnly: true` forbids them. Use `const` object maps (e.g. `DEPTH_MAP` in `src/types.ts`).
- **Use `cn()` for all conditional classes** — import from `src/lib/cn`, never concatenate strings manually. oxfmt will sort Tailwind classes inside `cn()` / `clsx()` calls on save.
- **Board CSS variables, not Tailwind** — `--sq-size`, `--board-size`, and all `--color-*` / `--sq-*` tokens are CSS custom properties in `src/index.css`. Use `style={{ … }}` with `var(--token)` for anything depending on them; Tailwind doesn't know about these values.
- **Tailwind v4 — no config file** — do not create `tailwind.config.js/ts`. The plugin is `@tailwindcss/vite`; theme extensions go in `src/index.css` using `@theme`.
- **Worker pattern is fixed** — spawn with `new Worker(new URL('../engine/chessWorker.ts', import.meta.url), { type: 'module' })`. Do not change `worker.format` in `vite.config.ts`; it must stay `"es"`.
- **Game logic stays in the hook** — `useChessGame` owns all Chess state and worker communication. Components must remain presentational (no direct `Chess` instantiation except `Board.tsx` which creates a read-only instance from the passed FEN to render pieces).
- **Stale-message guard** — any new worker message must increment the module-level `msgId` and store the new id in `pendingMsgId.current`; responses with a different id must be discarded.
- **Run `pnpm fmt && pnpm typecheck && pnpm lint` before finishing** — there are no tests; these three checks are the validation gate.
