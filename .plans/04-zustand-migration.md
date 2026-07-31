# Zustand Migration Plan

## Overview

Migrate all game state from the `useChessGame` React hook into a Zustand store. Components will read state and call actions directly from the store, removing the prop-drilling through `App.tsx` and eliminating the manual ref-state synchronisation workarounds in the hook.

The Web Worker, Chess.js instance, and the module-level `msgId` counter are **not** React state — they stay outside React as module-level or store-internal references. Zustand is not a replacement for the worker; it is a replacement for the 13 `useState` calls and 4 mirror refs inside `useChessGame`.

### Goals

- Single Zustand store owns all game state
- Components subscribe directly to the slices they need (no prop-drilling)
- `App.tsx` no longer destructures 24 items from a hook and fans them out as props
- Manual ref mirrors (`gameModeRef`, `difficultyRef`, `difficultyBlackRef`, `isPausedRef`) are deleted; Zustand `getState()` provides synchronous access to current values inside callbacks and worker handlers

### Non-goals

- No changes to game logic, worker protocol, or chess rules
- No changes to component render output or visual design
- No introduction of middleware beyond the Zustand `devtools` wrapper
- `SetupScreen` keeps its own local `useState` (it is pre-game UI, not game state)
- `Sidebar`'s `historyEndRef` scroll ref stays local

---

## Sub-Tasks

---

### Sub-Task 1 — Install Zustand

**Intent**  
Add `zustand` as a production dependency.

**Expected Outcomes**

- `zustand` appears in `package.json` `dependencies`
- `pnpm install` completes without errors

**Todo List**

1. Run `pnpm add zustand`
2. Verify the package appears in `package.json`

**Relevant Context**

- `package.json` — current dependencies section
- No config file changes required (Zustand has no build plugin)

**Status** — `[ ] pending`

---

### Sub-Task 2 — Create `src/store/chessStore.ts`

**Intent**  
Define the Zustand store that owns all state currently held in `useChessGame`. The store encapsulates the Chess.js instance (`gameRef`), worker reference (`workerRef`), and `msgId` counter as store-internal module-level variables (not Zustand state slices — they don't need to trigger re-renders). Zustand state slices mirror the 13 `useState` fields exactly. Actions replace the four `useCallback` functions.

**Expected Outcomes**

- `src/store/chessStore.ts` exists and exports `useChessStore`
- The store shape matches the `UseChessGameReturn` interface field-for-field
- No `useState`, `useRef`, or `useEffect` inside the store file
- Worker is spawned once when the store module is first imported (module-level side effect), not inside a React effect
- `getState()` is used inside worker `onmessage` and `setTimeout` callbacks instead of refs — eliminating the four mirror refs
- The `devtools` middleware wraps the store for DevTools access

**State slices (Zustand `set`-managed)**

```
fen, selectedSquare, legalMoveSquares, lastMove, status,
history, capturedPieces, playerColor, difficulty, difficultyBlack,
gameMode, isComputerThinking, isPaused
```

**Non-state (module-level, not in Zustand)**

```
game: Chess instance
worker: Worker instance
msgId: number counter
pendingMsgId: number
```

**Actions (store methods)**

- `syncState()` — reads `game`, calls `set(...)` for fen/status/history/capturedPieces
- `selectSquare(sq)` — replaces the `selectSquare` useCallback
- `resetGame(color, difficulty, mode, difficultyBlack?)` — replaces `resetGame`
- `togglePause()` — replaces `togglePause`
- `triggerComputerMove(...)` — internal helper, not exposed

**Todo List**

1. Create `src/store/` directory
2. Write `src/store/chessStore.ts`:
   - Declare module-level `game`, `worker`, `msgId`, `pendingMsgId`
   - Spawn worker at module load and attach `onmessage` handler; handler uses `useChessStore.getState()` to read current `gameMode`, `difficulty`, `difficultyBlack`, `isPaused`
   - Define store state interface
   - Implement `create(devtools(...))` with all state slices and actions
   - `resetGame` resets both module-level vars and store state slices; no refs to sync
3. Export `useChessStore` as the default named export

**Relevant Context**

- `src/hooks/useChessGame.ts` — all logic to port; worker `onmessage` handler at lines 106–143; `triggerComputerMove` at lines 146–168; `selectSquare` at lines 171–224; `resetGame` at lines 227–260; `togglePause` at lines 263–278
- `src/types.ts` — all type imports needed in the store
- `src/engine/chessWorker.ts` — worker message protocol: `{ fen, depth, id }` in, `{ bestMove, id }` out

**Status** — `[ ] pending`

---

### Sub-Task 3 — Refactor `App.tsx`

**Intent**  
Remove the `useChessGame()` call and prop-fan-out from `App.tsx`. Components will read their own state directly from the store, so `App.tsx` only needs to manage `gameStarted` local state and wire `handleStart` / `handleNewGame`.

**Expected Outcomes**

- `useChessGame` import and destructure are gone from `App.tsx`
- All per-component prop passing (StatusBar 10 props, Board 7 props, Sidebar 4 props) is removed
- `App.tsx` calls `useChessStore` only for `resetGame` (needed in `handleStart`)
- `App.tsx` remains the conditional render gate between `SetupScreen` and the game layout

**Todo List**

1. Remove `useChessGame` import
2. Replace the 24-item destructure with `const { resetGame } = useChessStore()`
3. Remove all props from `<StatusBar />`, `<Board />`, `<Sidebar />` JSX — they will be propless (or near-propless)
4. Keep `gameStarted` useState and `handleStart` / `handleNewGame` logic unchanged

**Relevant Context**

- `src/App.tsx` — lines 14–32 (destructure), lines 76–104 (prop passing)
- After this sub-task components will temporarily have TypeScript errors (missing required props) until Sub-Task 4 is complete

**Status** — `[ ] pending`

---

### Sub-Task 4 — Refactor components to consume the store directly

**Intent**  
Remove all game-state props from `Board`, `StatusBar`, and `Sidebar`. Each component calls `useChessStore(selector)` to subscribe to only the slices it needs, eliminating prop interfaces for game state.

**Expected Outcomes**

- `BoardProps`, `StatusBarProps`, `SidebarProps` no longer include game-state fields
- Each component uses `useChessStore` with a fine-grained selector to avoid unnecessary re-renders
- `onSquareClick` prop on `Board` is removed; `Board` calls `useChessStore(s => s.selectSquare)` directly
- `onNewGame` on `StatusBar` is removed; `StatusBar` calls a local `handleNewGame` — **wait**, `onNewGame` triggers `setGameStarted(false)` which is in `App`. Keep `onNewGame` and `onTogglePause` as props on `StatusBar` (they are UI callbacks, not game state). Only game-state props are removed.
- `SetupScreen` is unchanged (it has no game-state props)
- All TypeScript errors from Sub-Task 3 are resolved

**Props to remove per component**

| Component   | Props to remove                                                                                   | Props to keep              |
| ----------- | ------------------------------------------------------------------------------------------------- | -------------------------- |
| `Board`     | `fen, selectedSquare, legalMoveSquares, lastMove, playerColor, isComputerThinking, onSquareClick` | none — fully store-driven  |
| `StatusBar` | `status, turn, playerColor, difficulty, difficultyBlack, gameMode, isComputerThinking, isPaused`  | `onNewGame, onTogglePause` |
| `Sidebar`   | `history, capturedPieces, playerColor, isComputerThinking`                                        | none — fully store-driven  |

**Todo List**

1. **`Board.tsx`**: delete `BoardProps` interface; call `useChessStore` to get `fen, selectedSquare, legalMoveSquares, lastMove, playerColor, isComputerThinking, selectSquare`
2. **`StatusBar.tsx`**: delete game-state fields from `StatusBarProps`; call `useChessStore` to get `status, turn (gameRef.current.turn()), playerColor, difficulty, difficultyBlack, gameMode, isComputerThinking, isPaused, togglePause`; keep `onNewGame` prop
3. **`Sidebar.tsx`**: delete `SidebarProps` interface; call `useChessStore` to get `history, capturedPieces, playerColor, isComputerThinking`

**Note on `turn`**: `turn` is derived from the Chess.js instance. Two options: (a) store `turn` as a Zustand slice updated in `syncState`, or (b) compute it from `fen` inside the component. Option (a) is cleaner — add `turn: PieceColor` as a store slice updated alongside `fen` in `syncState`.

**Relevant Context**

- `src/components/Board.tsx`
- `src/components/StatusBar.tsx`
- `src/components/Sidebar.tsx`
- `src/store/chessStore.ts` (created in Sub-Task 2)

**Status** — `[ ] pending`

---

### Sub-Task 5 — Delete `useChessGame` and update `AGENTS.md`

**Intent**  
Remove the now-unused hook file, clean up its import from any remaining files, and update `AGENTS.md` to reflect the new architecture.

**Expected Outcomes**

- `src/hooks/useChessGame.ts` is deleted
- No file in the project imports from `../hooks/useChessGame` or `./hooks/useChessGame`
- `AGENTS.md` Architecture section reflects the new store-centric structure
- `AGENTS.md` Stack section mentions Zustand

**Todo List**

1. Delete `src/hooks/useChessGame.ts`
2. Verify no remaining imports reference it (`grep -r "useChessGame"`)
3. Update `AGENTS.md`:
   - Add `zustand` to the Stack section
   - Replace the Architecture diagram to show `App.tsx → useChessStore ← components`
   - Remove the "Single hook, pure components" constraint bullet or update it to reflect the store pattern
   - Update the "Web Worker is long-lived" bullet to note the worker is spawned at store module load

**Relevant Context**

- `src/hooks/useChessGame.ts`
- `AGENTS.md` — Architecture and Stack sections

**Status** — `[ ] pending`

---

### Sub-Task 6 — Validation

**Intent**  
Confirm the migration is correct and complete by running the full validation gate.

**Expected Outcomes**

- `pnpm fmt && pnpm typecheck && pnpm lint && pnpm test` all pass with no new warnings or failures
- App runs (`pnpm dev`) and all three game modes work: vs-computer, multiplayer, CPU vs CPU including pause/resume

**Todo List**

1. Run `pnpm fmt` — fix any formatting issues
2. Run `pnpm typecheck` — resolve any type errors
3. Run `pnpm lint` — resolve any lint warnings
4. Run `pnpm test` — all tests pass

**Relevant Context**

- All modified files

**Status** — `[ ] pending`
