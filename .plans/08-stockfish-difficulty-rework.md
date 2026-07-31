# Plan: Stockfish Difficulty Rework

## Overview

The current Stockfish difficulty implementation sends both `Skill Level` and `go depth N` to the engine simultaneously. These two parameters work against each other — `depth` caps the search tree while `Skill Level` degrades a full-depth search — producing unpredictable and generally weak play at all settings. `depth 5` is also far below Stockfish's real ceiling.

The correct approach is to use Stockfish's built-in `UCI_LimitStrength` + `UCI_Elo` API (which maps to real Elo ratings and is internally well-calibrated), combined with `go movetime` (which gives consistent, predictable response times). The `depth`-based limit should be removed from the Stockfish path entirely.

**Target configuration:**

| Difficulty | UCI_Elo | movetime |
| ---------- | ------- | -------- |
| Easy       | 1320    | 200 ms   |
| Medium     | 1800    | 500 ms   |
| Hard       | 2800    | 1500 ms  |

---

## Sub-Tasks

---

### Sub-Task 1 — Extend `EngineOptions` and update type constants

**Intent**  
Add a `movetime` field to the shared `EngineOptions` type so Stockfish can receive a time budget per move. Replace the `skillLevel` field (which carried the raw 0–20 value) with an `elo` field that carries the target Elo rating. Add a `ELO_MAP` and `MOVETIME_MAP` in `src/types.ts`; remove or leave `SKILL_MAP` unused (it is only referenced in `src/routes/index.tsx` for display purposes — its display usage will be replaced in Sub-Task 4).

**Expected Outcomes**

- `EngineOptions` in `src/lib/engine/index.ts` has `elo: number` and `movetime: number` instead of `skillLevel: number` and `depth: number` for the Stockfish path.
- `src/types.ts` exports `ELO_MAP` and `MOVETIME_MAP` keyed by `Difficulty`.
- `SKILL_MAP` and `DEPTH_MAP` remain for the Minimax (v1) engine — `DEPTH_MAP` is still used by the store and `MinimaxEngine`.
- TypeScript compiles cleanly (`pnpm typecheck` passes).

**Todo List**

1. In `src/lib/engine/index.ts`: change `EngineOptions` — replace `skillLevel: number` with `elo: number` and `depth: number` with `movetime: number`. Keep both fields required (no optionals needed; v1 will receive dummy values it ignores, or we split the type — see note below).
   - **Note:** The simplest approach is to keep a single `EngineOptions` with all four fields (`depth`, `skillLevel`, `elo`, `movetime`) and let each engine read only what it needs. This avoids a union type split and is a minimal change.
2. In `src/types.ts`: add `ELO_MAP` (`easy: 1320, medium: 1800, hard: 2800`) and `MOVETIME_MAP` (`easy: 200, medium: 500, hard: 1500`).

**Relevant Context**

- `src/lib/engine/index.ts` — `EngineOptions` type definition
- `src/types.ts` — `DEPTH_MAP`, `SKILL_MAP`

**Status:** `[x] done`

---

### Sub-Task 2 — Update `StockfishEngine.getBestMove` to use UCI_Elo + movetime

**Intent**  
Replace the engine's current `Skill Level` + `go depth` pattern with `UCI_LimitStrength`, `UCI_Elo`, and `go movetime`. The engine should also send `setoption name UCI_LimitStrength value true` once (or whenever Elo changes) and cache the current Elo to avoid redundant UCI commands (same pattern as the existing `currentSkill` cache).

**Expected Outcomes**

- UCI commands sent per move (when strength setting is unchanged):
  ```
  position fen {fen}
  isready
  go movetime {ms}
  ```
- UCI commands sent when Elo changes:
  ```
  setoption name UCI_LimitStrength value true
  setoption name UCI_Elo value {elo}
  position fen {fen}
  isready
  go movetime {ms}
  ```
- The `currentSkill` field is replaced with `currentElo` (same caching semantics).
- The fallback `opts.depth ?? 12` line is removed.

**Todo List**

1. In `src/lib/engine/v2/stockfish.ts`:
   - Rename `currentSkill` to `currentElo`, initialise to `-1`.
   - In `getBestMove`: replace the `skillLevel` block with an `elo` block that sends both `UCI_LimitStrength value true` and `UCI_Elo value {elo}` when `opts.elo !== this.currentElo`.
   - Replace `const limit = \`depth ${opts.depth ?? 12}\`` with `const limit = \`movetime ${opts.movetime}\``.
2. Verify the UCI command names match Stockfish 18 lite's supported options (they do — `UCI_LimitStrength` and `UCI_Elo` are standard UCI options).

**Relevant Context**

- `src/lib/engine/v2/stockfish.ts` — `getBestMove`, `currentSkill`

**Status:** `[x] done`

---

### Sub-Task 3 — Update the store to pass `elo` and `movetime`

**Intent**  
Update `triggerComputerMove` in `chessStore.ts` to build `EngineOptions` using the new `ELO_MAP` and `MOVETIME_MAP` constants instead of `SKILL_MAP`. The `DEPTH_MAP` usage for v1 stays unchanged.

**Expected Outcomes**

- When `engineVersion === "v2"`, the store passes `elo` and `movetime` from `ELO_MAP` / `MOVETIME_MAP`.
- When `engineVersion === "v1"`, the store still passes `depth` from `DEPTH_MAP` (and can pass dummy/zero values for `elo`/`movetime` since `MinimaxEngine` ignores them).
- No runtime errors; `pnpm test` passes.

**Todo List**

1. In `src/store/chessStore.ts`: import `ELO_MAP` and `MOVETIME_MAP` from `@/types`.
2. Build `EngineOptions` with all four fields: `depth` from `DEPTH_MAP`, `skillLevel` from `SKILL_MAP` (or 0), `elo` from `ELO_MAP`, `movetime` from `MOVETIME_MAP`.
   - Both engines read only their relevant fields, so passing all four is safe and avoids any conditional branching in the store.

**Relevant Context**

- `src/store/chessStore.ts` — `triggerComputerMove` (around line 162–182)
- `src/types.ts` — `DEPTH_MAP`, `ELO_MAP`, `MOVETIME_MAP`

**Status:** `[x] done`

---

### Sub-Task 4 — Update the setup UI descriptions

**Intent**  
Replace the `SKILL_DESCS` display labels (currently `"Skill 3"`, `"Skill 10"`, `"Skill 20"`) with meaningful Elo labels (`"~1320 Elo"`, `"~1800 Elo"`, `"~2800 Elo"`) so players understand the difficulty in real terms. The `DEPTH_DESCS` for v1 stay unchanged.

**Expected Outcomes**

- Easy shows `"~1320 Elo"` when Stockfish is selected.
- Medium shows `"~1800 Elo"` when Stockfish is selected.
- Hard shows `"~2800 Elo"` when Stockfish is selected.
- v1 difficulty picker still shows `"Depth 1"` / `"Depth 3"` / `"Depth 5"`.

**Todo List**

1. In `src/routes/index.tsx`: update `SKILL_DESCS` values:
   - `easy: "~1320 Elo"`, `medium: "~1800 Elo"`, `hard: "~2800 Elo"`.
2. Remove the now-unused `SKILL_MAP` import from `src/routes/index.tsx` if it was ever imported there (it wasn't — `SKILL_DESCS` is a local constant, so no import change needed).

**Relevant Context**

- `src/routes/index.tsx` — `SKILL_DESCS` constant (line 40–44)

**Status:** `[x] done`

---

### Sub-Task 5 — Validation

**Intent**  
Run the full validation gate to confirm all changes compile, lint, and test cleanly.

**Expected Outcomes**

- `pnpm check` passes with no new errors, warnings, or test failures.

**Todo List**

1. Run `pnpm check` (`fmt:check && typecheck && lint && test`).
2. Fix any issues surfaced.

**Status:** `[x] done`
