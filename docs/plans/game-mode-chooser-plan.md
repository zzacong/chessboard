# Game Mode Chooser + Local 2-Player Plan

## Overview

Add a game mode chooser to the pre-game `SetupScreen` and support local two-player (pass-and-play) mode. The two modes are **"vs Computer"** (existing AI opponent) and **"Local 2 Player"** (both players on the same device, no network).

## Confirmed Decisions

- `GameMode` values: `"vs-computer"` | `"multiplayer"`
- Board orientation in 2P: fixed to player 1's chosen color for the whole game
- Mode card icons: emoji (🤖 / 👥)

Scope:

- New `GameMode` type in `types.ts`
- `SetupScreen` gains a mode selector at the top; contextual options (difficulty hidden in 2P mode)
- `useChessGame` hook gains a `gameMode` parameter so it can skip AI logic in 2P mode
- `StatusBar` adapts its messages and info badge for 2P mode
- `App` wires the new mode through

---

## Sub-Tasks

---

### Sub-Task 1 — Add `GameMode` type to `types.ts`

**Intent**
Introduce a `GameMode` union type as the single source of truth for mode values across the app. Keeps the constraint "types.ts is the single source of shared types" from AGENTS.md.

**Expected Outcomes**

- `src/types.ts` exports `type GameMode = "vs-computer" | "multiplayer"`
- No other files change in this sub-task

**Todo List**

1. Open `src/types.ts`
2. Add `export type GameMode = "vs-computer" | "multiplayer";` after the existing type declarations

**Relevant Context**

- File: [`src/types.ts`](src/types.ts)
- Pattern: existing `Difficulty` and `GameStatus` unions in the same file

**Status** — `[ ] pending`

---

### Sub-Task 2 — Rework `SetupScreen` with mode chooser

**Intent**
Replace the static "Player vs Computer" subtitle with two interactive mode cards at the top of the card, then show contextual options below:

- **vs Computer**: existing color picker + difficulty selector (unchanged)
- **Local 2 Player**: only the color picker (player 1 picks their side; player 2 gets the other color automatically)

The `onStart` callback signature changes to include `gameMode`.

**Expected Outcomes**

- Two mode cards rendered at the top of the setup card: "vs Computer" (🤖) and "Local 2 Player" (👥)
- Selecting "Local 2 Player" hides the difficulty section entirely
- Selecting "vs Computer" shows color + difficulty (same as today)
- Default mode on open: "vs Computer"
- `onStart(color, difficulty, mode)` called on "Start Game" click

**Todo List**

1. Open `src/components/SetupScreen.tsx`
2. Add `gameMode` local state (`GameMode`, default `"vs-computer"`)
3. Import `GameMode` from `../types`
4. Add a `MODES` constant array: `[{ value: "vs-computer", label: "vs Computer", icon: "🤖" }, { value: "multiplayer", label: "Local 2 Player", icon: "👥" }]`
5. Replace the static subtitle paragraph with a grid of two mode-card buttons (same selected/unselected styling pattern already used for color/difficulty buttons)
6. Wrap the difficulty `<section>` in a conditional: only render when `gameMode === "vs-computer"`
7. When `gameMode` switches to `"multiplayer"`, reset `difficulty` state back to `"medium"` (or keep last value — either is fine since it won't be used)
8. Update the `onStart` prop type to `(color: PieceColor, difficulty: Difficulty, mode: GameMode) => void`
9. Update the Start button onClick to pass `gameMode`

**Relevant Context**

- File: [`src/components/SetupScreen.tsx`](src/components/SetupScreen.tsx)
- Selected-button style pattern: `borderColor: "var(--color-accent)"`, `background: "rgba(233,69,96,0.1)"`, `color: "#fff"`
- Unselected-button style: `borderColor: "var(--color-border)"`, `background: "var(--color-bg)"`, `color: "var(--color-text)"`

**Status** — `[ ] pending`

---

### Sub-Task 3 — Update `useChessGame` for 2-player mode

**Intent**
The hook currently hardcodes "one player vs AI" logic. It needs to accept a `gameMode` so that in `"local-2p"` mode it:

- Allows **both** colors to move (removes the `g.turn() !== playerColor` guard in multiplayer)
- Never calls `triggerComputerMove` (no AI in multiplayer)
- Still uses `playerColor` purely as the board-flip anchor (whose pieces face the player)

**Expected Outcomes**

- `resetGame(color, diff, mode)` accepts a third `GameMode` parameter
- A `gameMode` state value is stored and returned from the hook
- `selectSquare` in `"multiplayer"` mode: allows moves for whichever color's turn it is (both players share the same device); still blocks moves when game is over
- In `"vs-computer"` mode: behaviour is exactly as before
- `isComputerThinking` is always `false` in `"multiplayer"` mode (worker is never triggered)

**Todo List**

1. Open `src/hooks/useChessGame.ts`
2. Add `GameMode` to the import from `../types`
3. Add `gameMode` to `UseChessGameReturn` interface
4. Add `gameMode` state (`useState<GameMode>("vs-computer")`)
5. Update `resetGame` signature to `(color, diff, mode)`:
   - Store `mode` in state via `setGameMode`
   - Only call `triggerComputerMove` when `mode === "vs-computer"` and player chose black
6. Update `selectSquare` to read `gameMode` from state:
   - In `"multiplayer"`: replace `if (g.turn() !== playerColor) return` with no guard (allow any color to move); also skip calling `triggerComputerMove` after the move
   - In `"vs-computer"`: keep existing guard and post-move trigger
7. Add `gameMode` to the `selectSquare` dependency array
8. Return `gameMode` from the hook

**Relevant Context**

- File: [`src/hooks/useChessGame.ts`](src/hooks/useChessGame.ts)
- `selectSquare` at line ~130; `resetGame` at line ~174
- Architectural constraint: "all game state lives in `useChessGame`" — do not move mode state to a component

**Status** — `[ ] pending`

---

### Sub-Task 4 — Update `StatusBar` for 2-player mode

**Intent**
`StatusBar` currently renders AI-specific messages ("Computer wins", "Computer's turn", "Computer is thinking…") and a difficulty badge. In 2P mode these must be replaced with color-neutral messages and the difficulty badge replaced with a mode label.

**Expected Outcomes**

- In `"vs-computer"` mode: no visible change from today
- In `"multiplayer"` mode:
  - Status messages: "White wins! 🎉", "Black wins! 🎉", "White's turn", "Black's turn", "Check — White's king in danger!", "Check — Black's king in danger!"
  - Right-hand info badge: shows `"👥 Local 2P"` instead of `"♔ White · Medium"`
  - `isComputerThinking` is always `false` in multiplayer (hook guarantees it), so no "thinking…" message path needed

**Todo List**

1. Open `src/components/StatusBar.tsx`
2. Add `gameMode: GameMode` to `StatusBarProps`
3. Import `GameMode` from `../types`
4. Update `statusMessage()` to accept `gameMode` and branch its output:
   - In `"vs-computer"`: keep existing message strings exactly
   - In `"multiplayer"`: use color-based messages (e.g., "White wins! 🎉" / "Black wins! 🎉", "White's turn" / "Black's turn")
5. Update the info badge on the right: in `"multiplayer"` mode render `"👥 Local 2P"` instead of the color + difficulty string
6. Update the `statusMessage` call site to pass `gameMode`

**Relevant Context**

- File: [`src/components/StatusBar.tsx`](src/components/StatusBar.tsx)
- `statusMessage` function at line ~22; info badge at line ~92

**Status** — `[ ] pending`

---

### Sub-Task 5 — Wire everything together in `App.tsx`

**Intent**
`App` must thread the new `gameMode` from `SetupScreen → handleStart → useChessGame → StatusBar`. It is the integration point that ties all previous sub-tasks together.

**Expected Outcomes**

- `handleStart` receives and forwards `gameMode` to `resetGame`
- `StatusBar` receives `gameMode` prop
- `Board` and `Sidebar` are unchanged (they don't need mode awareness)
- The app compiles and passes `pnpm typecheck` and `pnpm lint`

**Todo List**

1. Open `src/App.tsx`
2. Import `GameMode` from `./types`
3. Destructure `gameMode` from `useChessGame()`
4. Update `handleStart` signature to `(color, diff, mode: GameMode)` and forward `mode` to `resetGame(color, diff, mode)`
5. Pass `gameMode` to `<StatusBar>`
6. Run `pnpm typecheck && pnpm lint` to confirm no errors

**Relevant Context**

- File: [`src/App.tsx`](src/App.tsx)
- `handleStart` at line ~30; `StatusBar` usage at line ~72

**Status** — `[ ] pending`

---

## Execution Order

Sub-tasks must be executed in order (1 → 2 → 3 → 4 → 5) because each builds on type definitions and interfaces introduced by the previous one.
