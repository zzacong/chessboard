# Computer vs Computer Mode

## Overview

Add a third game mode — **Computer vs Computer** — where both sides are played by the minimax AI engine. The game auto-plays continuously from start, with per-side difficulty settings (so White and Black can have different depths). The user can pause and resume at any time from the StatusBar. No human interaction with the board is possible in this mode.

**Scope:**

- New `"computer-vs-computer"` `GameMode` value in `src/types.ts`
- `useChessGame` hook extended to drive the CvC auto-play loop and expose pause/resume
- `SetupScreen` updated with a new mode option and dual difficulty pickers
- `StatusBar` updated with CvC status messages and a Pause/Resume button
- `App.tsx` wiring for the extra parameters

**Non-goals:** No speed control (move delay is fixed), no engine swap, no PGN export.

---

## Sub-Tasks

---

### Sub-Task 1 — Extend types

**Intent:** Add the new mode literal and a `difficultyBlack` concept to the shared type definitions, so TypeScript enforces correctness across the whole codebase from the start.

**Expected Outcomes:**

- `GameMode` union includes `"computer-vs-computer"`
- `UseChessGameReturn` (in `useChessGame.ts`) exposes `difficultyBlack`, `isPaused`, and `togglePause`
- `resetGame` signature accepts optional `difficultyBlack` parameter
- All existing callers still compile (the new param can default to `"medium"`)

**Todo List:**

1. In `src/types.ts`, add `"computer-vs-computer"` to the `GameMode` union.
2. In `src/hooks/useChessGame.ts`, extend the `UseChessGameReturn` interface:
   - Add `difficultyBlack: Difficulty`
   - Add `isPaused: boolean`
   - Add `togglePause: () => void`
3. Update `resetGame` signature to accept `difficultyBlack?: Difficulty` (defaults to `"medium"`).

**Relevant Context:**

- [`src/types.ts`](../../src/types.ts) — `GameMode` type definition
- [`src/hooks/useChessGame.ts`](../../src/hooks/useChessGame.ts) — `UseChessGameReturn` interface and `resetGame`

**Status:** [ ] pending

---

### Sub-Task 2 — Update `useChessGame` hook

**Intent:** Drive the CvC auto-play loop inside the hook. After each worker response (when the mode is `"computer-vs-computer"` and the game is not over and not paused), immediately schedule the next computer move for the other side. Expose `isPaused`/`togglePause` so the UI can halt and resume the loop.

**Expected Outcomes:**

- In CvC mode, moves alternate automatically White → Black → White … without user interaction
- When paused, the current move (if in-flight) completes but no further move is scheduled until resumed
- When resumed, the next move is triggered immediately (with the normal 150 ms delay)
- `triggerComputerMove` uses the correct depth for whichever side is about to move
- `selectSquare` is a no-op in CvC mode (board is view-only)
- `resetGame` initialises `difficultyBlack`, resets `isPaused` to `false`, and triggers the first move (white's move, since chess always starts with white)

**Todo List:**

1. Add `difficultyBlack` state (`useState<Difficulty>("medium")`).
2. Add `isPaused` state (`useState(false)`).
3. Extend `triggerComputerMove` to accept `currentDifficultyBlack: Difficulty` and compute depth as:
   - `g.turn() === "w"` → use `currentDifficulty` (white's depth)
   - `g.turn() === "b"` → use `currentDifficultyBlack` (black's depth)
   - Remove the existing guard `if (g.turn() === currentPlayerColor) return` — in CvC mode both sides are computers; in vs-computer mode the guard still applies (pass `playerColor` as before, only call the function when it's the computer's turn).
4. In the worker `onmessage` handler, after applying the move and calling `syncState()`, check: if `gameMode === "computer-vs-computer"` and game is not over and not paused, schedule the next `triggerComputerMove` call with a 150 ms `setTimeout`.
5. Add `togglePause`:
   ```
   if currently paused → set isPaused false → immediately trigger next computer move
   if currently playing → set isPaused true (in-flight move completes naturally)
   ```
6. In `selectSquare`, add an early return if `gameMode === "computer-vs-computer"`.
7. In `resetGame`:
   - Accept and store `difficultyBlack` parameter.
   - Reset `isPaused` to `false`.
   - After resetting, always trigger white's first move (CvC always starts with white moving).
   - Remove the existing `if (mode === "vs-computer" && color === "b")` guard; refactor so:
     - `"vs-computer"` + player is black → trigger computer move (white goes first) ✓ (same as now)
     - `"computer-vs-computer"` → always trigger white's first move
8. Return `difficultyBlack`, `isPaused`, `togglePause` from the hook.

**Relevant Context:**

- [`src/hooks/useChessGame.ts`](../../src/hooks/useChessGame.ts) — full hook implementation
- The `isPaused` check must be a ref-read inside the `onmessage` callback (not a stale closure on state), so use `useRef` for `isPaused` alongside the state to avoid stale closure issues — or use a functional update pattern. Prefer a `isPausedRef` mirroring the state, toggled in `togglePause`.
- `msgId` is module-level; resetting the game increments it to invalidate any in-flight response. This remains unchanged.

**Status:** [ ] pending

---

### Sub-Task 3 — Update `SetupScreen`

**Intent:** Present the new mode option to the user and collect per-side difficulty when CvC is selected.

**Expected Outcomes:**

- Three mode buttons: "vs Computer 🤖", "Local 2 Player 👥", "CPU vs CPU 🤖🤖"
- When "CPU vs CPU" is selected:
  - "Play as" section is hidden (irrelevant — the user is just watching)
  - A two-column difficulty section appears labelled "White" and "Black" (each with Easy/Medium/Hard buttons)
- `onStart` is called with `color = "w"` (fixed, since in CvC the board always shows white at the bottom), `difficulty` = white difficulty, `difficultyBlack` = black difficulty
- `onStart` prop signature extended to `(color, difficulty, mode, difficultyBlack?) => void`

**Todo List:**

1. Add `"computer-vs-computer"` to the `MODES` constant array with label "CPU vs CPU" and icon "🤖🤖".
2. Add local state `difficultyBlack: Difficulty` (default `"medium"`).
3. Conditionally hide "Play as" section when `gameMode === "computer-vs-computer"`.
4. Conditionally replace the single "Difficulty" section with two side-by-side or stacked pickers ("White" and "Black") when `gameMode === "computer-vs-computer"`.
5. Update the `onStart` call to pass `difficultyBlack` when in CvC mode (pass `"medium"` for other modes as it's unused).
6. Update the `SetupScreenProps` interface to add `onStart: (color, difficulty, mode, difficultyBlack?: Difficulty) => void`.

**Relevant Context:**

- [`src/components/SetupScreen.tsx`](../../src/components/SetupScreen.tsx) — existing mode/difficulty UI
- Keep the existing MODES array pattern; just append the new entry.
- The dual difficulty pickers can reuse the same `DIFFICULTIES` constant, rendered twice with different labels and separate state vars.

**Status:** [ ] pending

---

### Sub-Task 4 — Update `StatusBar`

**Intent:** Display correct status messages for CvC mode and add a Pause/Resume button.

**Expected Outcomes:**

- CvC status messages:
  - Playing: "White is thinking…" / "Black is thinking…" (based on `turn`)
  - Check: "Check — White's / Black's king in danger!"
  - Checkmate: "Checkmate — White/Black wins! 🎉"
  - Stalemate / Draw: same as existing messages
- Mode indicator chip shows "🤖🤖 CPU vs CPU · Easy vs Hard" (or whatever the two difficulties are)
- A "Pause" / "Resume" button appears next to "New Game" only when `gameMode === "computer-vs-computer"` and the game is not over

**Todo List:**

1. Add `difficultyBlack: Difficulty`, `isPaused: boolean`, and `onTogglePause?: () => void` to `StatusBarProps`.
2. Add a `"computer-vs-computer"` branch in `statusMessage()`:
   - Map `turn` to "White" / "Black"
   - Return appropriate text for each `status` value
3. Update the mode indicator chip: add a CvC case displaying both difficulties.
4. Render a Pause/Resume button when `gameMode === "computer-vs-computer"` and `!isOver`. Style consistently with the existing "New Game" button. Label: "Pause" when playing, "Resume" when paused.

**Relevant Context:**

- [`src/components/StatusBar.tsx`](../../src/components/StatusBar.tsx) — existing `statusMessage()` function and indicator chip
- [`src/types.ts`](../../src/types.ts) — `DIFFICULTY_LABELS` equivalent is already in StatusBar

**Status:** [ ] pending

---

### Sub-Task 5 — Wire everything in `App.tsx`

**Intent:** Pass the new parameters and callbacks through from `useChessGame` to `SetupScreen` and `StatusBar`.

**Expected Outcomes:**

- `handleStart` accepts and forwards `difficultyBlack`
- `useChessGame` destructuring includes `difficultyBlack`, `isPaused`, `togglePause`
- `StatusBar` receives `difficultyBlack`, `isPaused`, `onTogglePause`

**Todo List:**

1. Destructure `difficultyBlack`, `isPaused`, and `togglePause` from `useChessGame()`.
2. Update `handleStart` to accept and pass `difficultyBlack` to `resetGame`.
3. Pass `difficultyBlack`, `isPaused`, and `onTogglePause={togglePause}` to `StatusBar`.

**Relevant Context:**

- [`src/App.tsx`](../../src/App.tsx) — thin orchestration layer

**Status:** [ ] pending

---

### Sub-Task 6 — Validation

**Intent:** Confirm the full feature works correctly and the project's validation gate passes.

**Expected Outcomes:**

- `pnpm fmt && pnpm typecheck && pnpm lint && pnpm test` all pass with no new warnings
- Manual smoke-test: launch CvC, both sides play automatically; pause stops the loop; resume continues it; "New Game" returns to the setup screen

**Todo List:**

1. Run `pnpm fmt` and fix any formatting issues.
2. Run `pnpm typecheck` and resolve any type errors.
3. Run `pnpm lint` and fix any lint violations.
4. Run `pnpm test` and confirm all existing tests still pass.

**Relevant Context:**

- Validation gate from AGENTS.md: `pnpm fmt && pnpm typecheck && pnpm lint && pnpm test`

**Status:** [ ] pending
