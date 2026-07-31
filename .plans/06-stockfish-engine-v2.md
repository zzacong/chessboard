# Stockfish Engine v2

## Overview

Add Stockfish 18 Lite as a second chess engine ("v2") alongside the existing minimax engine ("v1"). The current minimax engine moves to `src/lib/engine/v1/`, the new Stockfish worker lives at `src/lib/engine/v2/`. The setup screen gains an **Engine** picker (Minimax / Stockfish) that appears before the Game Mode section. The selected engine is stored in the Zustand store and the store routes worker messages to the appropriate worker at runtime.

**Scope:**

- Move existing minimax engine files to `src/lib/engine/v1/`
- Build a plain-JS Stockfish worker at `src/lib/engine/v2/stockfishWorker.js`
- Add an `EngineVersion` type and `SKILL_MAP` constant to `src/types.ts`
- Extend `ChessState` with an `engineVersion` field, thread it through `resetGame`
- Spawn both workers at store module load; route messages to the active one
- Add an Engine section to `src/routes/index.tsx`; update difficulty subtitles per engine

**Non-goals:** No server-side evaluation, no async Stockfish streaming UI, no change to board/sidebar/game components.

---

## Sub-Tasks

---

### Sub-Task 1 — Move minimax engine to v1 path

**Intent:** Relocate the two existing engine files into a `v1/` subdirectory and update all import references so nothing breaks before adding v2.

**Expected Outcomes:**

- `src/lib/engine/v1/minimax.ts` exists (moved from `src/lib/engine/minimax.ts`)
- `src/lib/engine/v1/chessWorker.ts` exists (moved from `src/lib/engine/chessWorker.ts`)
- `src/store/chessStore.ts` worker bootstrap URL updated to `../lib/engine/v1/chessWorker.ts`
- `pnpm check` passes with no new errors

**Todo List:**

1. Create directory `src/lib/engine/v1/`
2. Move `src/lib/engine/minimax.ts` → `src/lib/engine/v1/minimax.ts`
3. Move `src/lib/engine/chessWorker.ts` → `src/lib/engine/v1/chessWorker.ts`
4. Update the import inside `v1/chessWorker.ts` from `"./minimax"` to `"./minimax"` (relative, no change needed if same directory)
5. Update the `new Worker(new URL(...))` call in `chessStore.ts` from `"../lib/engine/chessWorker.ts"` → `"../lib/engine/v1/chessWorker.ts"`
6. Run `pnpm check` to confirm no breakage

**Relevant Context:**

- Worker bootstrap: [`chessStore.ts` line 268](src/store/chessStore.ts:268)
- Worker entry: [`src/lib/engine/chessWorker.ts`](src/lib/engine/chessWorker.ts)
- Import inside worker: [`chessWorker.ts` line 1](src/lib/engine/chessWorker.ts:1)

**Status:** [x] done

---

### Sub-Task 2 — Add `EngineVersion` type and `SKILL_MAP` to types.ts

**Intent:** Introduce the shared `EngineVersion` discriminant and the Stockfish skill-level map so both the store and the UI can reference a single source of truth.

**Expected Outcomes:**

- `src/types.ts` exports `type EngineVersion = "v1" | "v2"`
- `src/types.ts` exports `const SKILL_MAP: Record<Difficulty, number>` with values `{ easy: 3, medium: 10, hard: 20 }`
- No other files change in this sub-task

**Todo List:**

1. Add `export type EngineVersion = "v1" | "v2";` to `src/types.ts`
2. Add `export const SKILL_MAP: Record<Difficulty, number> = { easy: 3, medium: 10, hard: 20 };` to `src/types.ts`

**Relevant Context:**

- Existing pattern: [`DEPTH_MAP` in src/types.ts](src/types.ts:10)

**Status:** [x] done

---

### Sub-Task 3 — Build the Stockfish v2 worker

**Intent:** Create a plain-JS Web Worker that loads Stockfish via `importScripts`, speaks UCI, and returns `{ bestMove, id }` — the exact same message shape as the minimax worker so the store's `onmessage` handler needs no changes.

**Expected Outcomes:**

- `src/lib/engine/v2/stockfishWorker.js` exists and is a valid classic (non-module) Web Worker
- Worker accepts messages of shape `{ fen: string; skillLevel: number; id: number }`
- Worker responds with `{ bestMove: string; id: number }` — `bestMove` is a UCI move string (e.g. `"e2e4"`)
- Stockfish is loaded from `/stockfish/stockfish-18-lite-single.js` (relative URL from public/)

**UCI Protocol Flow inside the worker:**

1. `importScripts("/stockfish/stockfish-18-lite-single.js")` — loads the engine
2. On message: call `Stockfish()` to obtain an engine instance (if not yet initialised)
3. Send UCI commands: `ucinewgame`, `setoption name Skill Level value <skillLevel>`, `position fen <fen>`, `go depth 15`
4. Listen for `bestmove <move>` in engine output lines; extract the move and `postMessage({ bestMove, id })`
5. Handle the edge case where bestmove is `"(none)"` by posting `{ bestMove: "", id }`

**Implementation Notes:**

- The nmrugg/stockfish.js engine exposes itself via `Stockfish` global after `importScripts`
- Call `engine.postMessage(uciCommand)` to send UCI commands; receive output via `engine.onmessage = (line) => { ... }`
- Only one move computation is in-flight at a time (the store ensures this)
- Reuse the same engine instance across moves (do not call `Stockfish()` per move)

**Relevant Context:**

- Minimax worker for reference: [`src/lib/engine/v1/chessWorker.ts`](src/lib/engine/v1/chessWorker.ts) (after sub-task 1)
- Stockfish WASM asset: [`public/stockfish/stockfish-18-lite-single.js`](public/stockfish/stockfish-18-lite-single.js)
- nmrugg/stockfish.js API: engine instance via `Stockfish()`, UCI via `engine.postMessage()`, output via `engine.onmessage`

**Status:** [x] done

---

### Sub-Task 4 — Extend the store to support both engines

**Intent:** Add `engineVersion` to `ChessState`, spawn both workers at module load, route `triggerComputerMove` to the right worker, and thread `engineVersion` through `resetGame`.

**Expected Outcomes:**

- `ChessState` has `engineVersion: EngineVersion` (default `"v1"`)
- `resetGame` accepts an optional `engineVersion` parameter and sets it in state
- `triggerComputerMove` posts `{ fen, depth, id }` to the v1 worker when `engineVersion === "v1"` and `{ fen, skillLevel, id }` to the v2 worker when `engineVersion === "v2"` — using `SKILL_MAP[difficulty]` for the v2 payload
- Both workers are spawned at module load (two `new Worker(...)` calls)
- The single `onmessage` handler is shared: both workers respond with `{ bestMove, id }` so no branching is needed there
- `pnpm check` passes

**Todo List:**

1. Import `EngineVersion` and `SKILL_MAP` from `@/types`
2. Declare `let workerV2: Worker | null = null` alongside the existing `worker` (rename to `workerV1` for clarity, or leave as `worker` and add `workerV2`)
3. Add `engineVersion: EngineVersion` to `ChessState` interface with default `"v1"`
4. In `triggerComputerMove`: read `engineVersion` from state; if `"v2"` post `{ fen, skillLevel: SKILL_MAP[currentDifficulty], id }` to `workerV2`; if `"v1"` post existing `{ fen, depth, id }` to `worker`
5. Extend `resetGame` signature to accept `engineVersion?: EngineVersion` and set it in state
6. Spawn `workerV2` at module load pointing to `src/lib/engine/v2/stockfishWorker.js`; attach the same `onmessage` handler
7. Run `pnpm check`

**Relevant Context:**

- `triggerComputerMove` implementation: [`chessStore.ts` lines 119–135](src/store/chessStore.ts:119)
- Worker bootstrap: [`chessStore.ts` lines 267–297](src/store/chessStore.ts:267)
- `resetGame` signature: [`chessStore.ts` line 189](src/store/chessStore.ts:189)
- `ChessState` interface: [`chessStore.ts` lines 47–63](src/store/chessStore.ts:47)

**Note on v2 worker URL:** Because `stockfishWorker.js` is a classic worker (not an ES module), it must be spawned with `{ type: "classic" }`. Vite will copy it as-is since it's under `src/`; alternatively it can be placed in `public/` if the TS pipeline causes issues. Prefer `src/lib/engine/v2/stockfishWorker.js` with `?worker&url` import or a direct path reference. Document the final approach here after implementation.

**Status:** [x] done

---

### Sub-Task 5 — Add Engine picker to the setup screen

**Intent:** Add an "Engine" section to `src/routes/index.tsx` that lets the user pick Minimax or Stockfish before choosing the game mode. Update difficulty subtitle text to show `Depth N` for Minimax and `Skill N` for Stockfish. Pass the selected engine to `resetGame`.

**Expected Outcomes:**

- Setup screen shows an "Engine" section at the top with two buttons: "Minimax" (🧮, subtitle "v1 — Classic AI") and "Stockfish" (⚡, subtitle "v2 — Real Engine")
- Engine section is always visible (not conditional on game mode)
- Difficulty subtitles show `Depth 1/3/5` when Minimax is selected and `Skill 3/10/20` when Stockfish is selected
- Clicking Start Game calls `resetGame(color, difficulty, gameMode, difficultyBlack, engineVersion)`
- Multiplayer mode: engine picker can remain visible but has no effect (the store ignores it when no computer moves are triggered)

**Todo List:**

1. Add `EngineVersion` import to `index.tsx`
2. Add `SKILL_MAP` and `DEPTH_MAP` imports for subtitle rendering
3. Add local state: `const [engineVersion, setEngineVersion] = useState<EngineVersion>("v1")`
4. Add `ENGINES` constant array for the two engine options
5. Render "Engine" section above "Game Mode" using the same button/card pattern
6. Update `DifficultyPicker` (or the `desc` strings passed to it) to be dynamic based on `engineVersion`
7. Pass `engineVersion` to `resetGame` in `handleStart`
8. Update `resetGame` call site signature to include the new optional parameter

**Relevant Context:**

- Setup screen: [`src/routes/index.tsx`](src/routes/index.tsx)
- `DifficultyPicker` component: [`index.tsx` lines 30–56](src/routes/index.tsx:30)
- `DIFFICULTIES` array with `desc` field: [`index.tsx` lines 24–28](src/routes/index.tsx:24)
- `resetGame` store action — will be extended in sub-task 4

**Status:** [x] done

---

## Implementation Notes

### Worker Spawning Strategy for v2

The nmrugg/stockfish.js file is a classic (non-ESM) script. Vite's `?worker` syntax targets ES module workers. The cleanest approach is to place `stockfishWorker.js` as a plain JS file in `src/lib/engine/v2/` and reference it with:

```js
workerV2 = new Worker("/stockfish-worker.js"); // from public/
```

Or alternatively, use a Blob URL approach wrapping `importScripts`. The implementing agent should verify which approach Vite supports without extra config and document it in this file before proceeding.

### resetGame Signature Extension

After sub-task 4, the full signature becomes:

```ts
resetGame(color, difficulty, mode, difficultyBlack?, engineVersion?)
```

Both `difficultyBlack` and `engineVersion` are optional with defaults (`"medium"` and `"v1"` respectively).

### Difficulty Subtitles

| Engine    | Easy    | Medium   | Hard     |
| --------- | ------- | -------- | -------- |
| Minimax   | Depth 1 | Depth 3  | Depth 5  |
| Stockfish | Skill 3 | Skill 10 | Skill 20 |
