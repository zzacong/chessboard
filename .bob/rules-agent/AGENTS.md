# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Critical Coding Rules

- **`import type` is mandatory** — `verbatimModuleSyntax: true` means `import { type Foo }` is rejected; always write `import type { Foo }`.
- **No enums or namespaces** — `erasableSyntaxOnly: true` forbids them. Use `const` object maps (e.g. `DEPTH_MAP` in `src/types.ts`).
- **Use `cn()` for all conditional classes** — import from `src/lib/cn`, never concatenate strings manually. oxfmt will sort Tailwind classes inside `cn()` / `clsx()` calls on save.
- **Board CSS variables, not Tailwind** — `--sq-size`, `--board-size`, and all `--color-*` / `--sq-*` tokens are CSS custom properties in `src/index.css`. Use `style={{ … }}` with `var(--token)` for anything depending on them; Tailwind doesn't know about these values.
- **Tailwind v4 — no config file** — do not create `tailwind.config.js/ts`. The plugin is `@tailwindcss/vite`; theme extensions go in `src/index.css` using `@theme`.
- **Worker path** — spawn with `new Worker(new URL('../lib/engine/chessWorker.ts', import.meta.url), { type: 'module' })`. Do not change `worker.format` in `vite.config.ts`; it must stay `"es"`.
- **Game logic stays in the store** — `useChessStore` (Zustand) owns all Chess state and worker communication. Components must remain presentational (no direct `Chess` instantiation except `Board.tsx` which creates a read-only instance from the FEN read via the store).
- **Stale-message guard** — any new worker message must increment the module-level `msgId` and assign the new id to `pendingMsgId` (both are plain `let` numbers, not refs). Responses with a different id must be discarded.
- **Path aliases** — `@/` maps to `src/`. Always use `@/` for non-relative imports within `src/`; do not use long `../../` chains.
- **TanStack Router** — routes live in `src/routes/`. `src/routeTree.gen.ts` is auto-generated; do not edit it. Use `getChessState()` (not `useChessStore`) inside `beforeLoad` guards since they run outside React.
- **Run `pnpm check` before finishing** — runs `fmt:check && typecheck && lint && test`. Test APIs (`describe`, `it`, `expect`, `vi`) must be imported explicitly from `"vitest"`.
