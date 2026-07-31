# Engine Interface Normalisation

## Overview

The two chess engines (`v1` MinimaxEngine and `v2` StockfishEngine) grew independently and were never
normalised behind a shared contract. This causes:

- A growing `if (engineVersion === "v2")` branch in the store's `triggerComputerMove` action.
- Missing methods on `MinimaxEngine` (`cancelSearch`, `newGame`) and a missing `onerror` handler on `StockfishEngine`.
- `resetGame`, `undoMove`, and `togglePause` always calling `getStockfish().cancelSearch()` / `getStockfish().newGame()` regardless of the active engine version, which silently creates the Stockfish worker even when only v1 is in use.
- No type-level guarantee that a new engine will be usable as a drop-in replacement.

**Goal:** introduce a shared `Engine` interface, normalise both engine classes against it, create a
single `getEngine(version)` factory, and simplify the store to remove the version branch.

**Non-goals:** changing the minimax algorithm, the Stockfish UCI configuration, game rules, or any UI.

---

## Sub-Tasks

---

### Sub-Task 1 — Define the `Engine` interface and `EngineOptions` type

**Status:** `[x] done`

**Intent**  
Establish the shared contract that all present and future engines must satisfy. This is the
foundation every other sub-task depends on.

**Expected Outcomes**

- A new file `src/lib/engine/engine.ts` exports `interface Engine` and `type EngineOptions`.
- `EngineOptions` covers both v1 (depth) and v2 (skillLevel, depth?) needs in a single shape.
- Both `getBestMove(fen, opts): Promise<string | null>` and `cancelSearch(): void` and `terminate(): void` are required. `newGame(): void` is an optional method (only meaningful for stateful engines like Stockfish).

**Todo List**

1. Create `src/lib/engine/engine.ts`.
2. Define `type EngineOptions = { depth: number; skillLevel: number }` — both engines receive both
   fields; each uses the one it cares about.
3. Define `interface Engine` with `getBestMove`, `cancelSearch`, `terminate`, and optional `newGame`.
4. Export both from the file.

**Relevant Context**

- Current v1 signature: `getBestMove(fen, depth, id)` — `src/lib/engine/v1/minimaxEngine.ts:30`
- Current v2 signature: `getBestMove(fen, opts: SearchOptions)` — `src/lib/engine/v2/stockfish.ts:51`
- `DEPTH_MAP` and `SKILL_MAP` in `src/types.ts` — the store already computes both values per move.
- The interface and `EngineOptions` type live in `src/lib/engine/engine.ts`; the factory lives in `src/lib/engine/index.ts`.

---

### Sub-Task 2 — Update `MinimaxEngine` to implement `Engine`

**Status:** `[x] done`

**Intent**
Bring v1 into conformance with the interface: normalise `getBestMove`, add no-op `cancelSearch` and
`newGame`.

**Expected Outcomes**

- `MinimaxEngine` declares `implements Engine`.
- `getBestMove(fen, opts)` signature matches the interface; it reads `opts.depth` internally. The `id`
  correlation token is an internal implementation detail — the class manages its own counter so the
  caller no longer needs to pass one.
- `cancelSearch()` is implemented as a no-op (the worker cannot be interrupted mid-search; stale
  results are already discarded by the store's `pendingMsgId` guard).
- `newGame()` is implemented as a no-op (minimax is stateless).

**Todo List**

1. Add `import type { Engine, EngineOptions } from "../engine"` to `minimaxEngine.ts` (import from `engine.ts` directly, not `index.ts`, to avoid a circular dependency).
2. Change `getBestMove` to accept `(fen: string, opts: EngineOptions)` and use `opts.depth`.
3. Remove the `id` parameter from `getBestMove`; manage an internal counter (`this.nextId`) instead.
4. Add `cancelSearch(): void {}` (no-op).
5. Add `newGame(): void {}` (no-op).
6. Add `implements Engine` to the class declaration.

**Relevant Context**

- `src/lib/engine/v1/minimaxEngine.ts` — full file.
- The worker message already carries an `id` field; that correlation still happens internally, just no
  longer surfaced in the public API.

---

### Sub-Task 3 — Update `StockfishEngine` to implement `Engine`

**Status:** `[x] done`

**Intent**  
Bring v2 into conformance with the interface and fill the missing `onerror` handler.

**Expected Outcomes**

- `StockfishEngine` declares `implements Engine`.
- `getBestMove(fen, opts: EngineOptions)` — reads `opts.skillLevel` and `opts.depth` (already does,
  just rename the param type).
- `onerror` handler added to the worker, rejecting / resolving all pending listeners with `null`.

**Todo List**

1. Add `import type { Engine, EngineOptions } from "../engine"` to `stockfish.ts` (import from `engine.ts` directly, not `index.ts`, to avoid a circular dependency).
2. Replace `SearchOptions` parameter type with `EngineOptions` in `getBestMove` (the internal reads
   of `opts.skillLevel` / `opts.depth` remain unchanged).
3. Add `this.worker.onerror` handler: clear all listeners, set `cancelCurrentSearch = null`, and if a
   search is in progress resolve its promise with `null`.
4. Add `implements Engine` to the class declaration.
5. The existing `SearchOptions` interface can be removed or kept as an internal alias — remove it to
   avoid confusion.

**Relevant Context**

- `src/lib/engine/v2/stockfish.ts` — full file.
- `MinimaxEngine.onerror` in `src/lib/engine/v1/minimaxEngine.ts:22–27` — use as a model.

---

### Sub-Task 4 — Create a unified `getEngine` factory

**Status:** `[x] done`

**Intent**
Replace the two separate `getMinimax()` / `getStockfish()` call-sites in the store with a single
`getEngine(version)` accessor that returns `Engine`. This is the only public API the store needs.

**Expected Outcomes**

- `src/lib/engine/index.ts` exports `getEngine(version: EngineVersion): Engine` (and re-exports `Engine` / `EngineOptions` from `engine.ts`).
- Both singleton caches (`let engine`) remain inside their respective modules; `getEngine` delegates to `getMinimax()` or `getStockfish()` based on `version`.
- The store imports only `getEngine` and `EngineOptions` from `@/lib/engine` (and no longer imports `getMinimax` / `getStockfish` directly).

**Todo List**

1. Create `src/lib/engine/index.ts`: import `getMinimax` and `getStockfish` from their modules, import `EngineVersion` from `@/types`, and export `getEngine(version: EngineVersion): Engine`.
2. Re-export `Engine` and `EngineOptions` from `src/lib/engine/index.ts` so the store has a single import point.
3. Remove the direct `import { getMinimax }` and `import { getStockfish }` from `chessStore.ts`.
4. Add `import { getEngine } from "@/lib/engine"` (and `import type { EngineOptions }` if needed) to `chessStore.ts`.

**Relevant Context**

- `src/store/chessStore.ts:18–19` — current imports.
- `src/types.ts:9` — `EngineVersion` type.
- `src/lib/engine/engine.ts` — interface definitions.
- `src/lib/engine/index.ts` — barrel / factory (new file).

---

### Sub-Task 5 — Simplify `triggerComputerMove` in the store

**Status:** `[x] done`

**Intent**  
Remove the `if (engineVersion === "v2")` branch by calling `getEngine(engineVersion).getBestMove()`
unconditionally. Also fix `resetGame`, `undoMove`, and `togglePause` to call `cancelSearch` /
`newGame` on the _active_ engine rather than always on Stockfish.

**Expected Outcomes**

- `triggerComputerMove` has a single `getEngine(engineVersion).getBestMove(fen, opts)` call; the
  `if/else` branch is gone.
- `resetGame` calls `getEngine(engVersion).cancelSearch()` and `getEngine(engVersion).newGame?.()`.
- `undoMove` and `togglePause` read `engineVersion` from `get()` and call `getEngine(engineVersion).cancelSearch()`.
- `DEPTH_MAP` and `SKILL_MAP` are both consulted to build a single `EngineOptions` object for every
  move.

**Todo List**

1. In `triggerComputerMove`, build `const opts: EngineOptions = { depth: DEPTH_MAP[activeDifficulty], skillLevel: SKILL_MAP[activeDifficulty] }`.
2. Replace the `if (engineVersion === "v2") { ... } getMinimax()...` block with a single `getEngine(engineVersion).getBestMove(game.fen(), opts).then(...)`.
3. In `resetGame`, replace `getStockfish().cancelSearch()` / `getStockfish().newGame()` with `getEngine(engVersion).cancelSearch()` / `getEngine(engVersion).newGame?.()`.
4. In `undoMove`, replace `getStockfish().cancelSearch()` with `getEngine(get().engineVersion).cancelSearch()`.
5. In `togglePause`, replace `getStockfish().cancelSearch()` with `getEngine(get().engineVersion).cancelSearch()`.
6. Remove `SKILL_MAP` import if it is moved into the options-building step, or keep it — ensure no unused imports remain.

**Relevant Context**

- `src/store/chessStore.ts:145–200` — `triggerComputerMove`.
- `src/store/chessStore.ts:276–314` — `resetGame`.
- `src/store/chessStore.ts:317–355` — `undoMove`.
- `src/store/chessStore.ts:357–375` — `togglePause`.

---

### Sub-Task 6 — Remove dead `"idle"` GameStatus variant

**Status:** `[x] done`

**Intent**  
Clean up the one dead code item surfaced in analysis: the `"idle"` variant of `GameStatus` is
declared but never returned by `deriveStatus` and never set by any store action.

**Expected Outcomes**

- `GameStatus` in `src/types.ts` no longer includes `"idle"`.
- No compilation errors or type-narrowing breakage elsewhere in the codebase.

**Todo List**

1. Search for any usage of `"idle"` as a `GameStatus` value across the codebase.
2. If no usages exist, remove `"idle"` from the union in `src/types.ts`.

**Relevant Context**

- `src/types.ts:8` — `GameStatus` union.
- `src/store/chessStore.ts:43–49` — `deriveStatus` (never returns `"idle"`).
- `src/store/chessStore.ts:121` — initial `status` is hardcoded to `"playing"`.
