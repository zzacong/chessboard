# Chessboard Game — Plan

## Top-Level Overview

Build a fully functional browser-based chess game (Player vs Computer) from scratch using **React + TypeScript + Vite**. Chess rules are handled by the **chess.js** library. The computer opponent uses a **Minimax algorithm with alpha-beta pruning** at three selectable difficulty levels (Easy / Medium / Hard). The UI features SVG chess pieces, move highlights, a last-move indicator, a captured-pieces tray, and a move-history panel. The player chooses their colour (White or Black) before the game starts.

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffolding

**Intent**  
Bootstrap the Vite + React + TypeScript project with the required dependencies and a clean directory structure.

**Expected Outcomes**

- `package.json` with `react`, `react-dom`, `chess.js`, and dev deps (`vite`, `@vitejs/plugin-react`, TypeScript types).
- `vite.config.ts`, `tsconfig.json`, `index.html` in place.
- `src/` folder with skeleton `App.tsx`, `main.tsx`, and `index.css`.
- `npm run dev` starts the dev server without errors.

**Todo List**

1. Create `package.json` with all required dependencies and scripts (`dev`, `build`, `preview`).
2. Create `vite.config.ts` and `tsconfig.json`.
3. Create `index.html` entry point.
4. Create `src/main.tsx` and a minimal `src/App.tsx`.
5. Create `src/index.css` with CSS reset and base font/colour tokens.

**Relevant Context**

- Greenfield project, no existing files.
- chess.js v1 — import: `import { Chess } from 'chess.js'`.

**Status** `[ ] pending`

---

### Sub-Task 2 — Chess Game State Hook

**Intent**  
Encapsulate all chess game state and logic in a single custom React hook (`useChessGame`) so components stay pure and presentational.

**Expected Outcomes**

- `src/hooks/useChessGame.ts` exports the hook.
- Hook exposes: `game` (Chess instance), `fen`, `turn`, `selectedSquare`, `legalMoves`, `lastMove`, `status` (`playing | check | checkmate | stalemate | draw`), `history`, `capturedPieces`, `playerColor`, `difficulty`, `isComputerThinking`.
- Actions: `selectSquare(sq)`, `resetGame(playerColor, difficulty)`.
- Selecting a piece highlights legal destination squares; clicking a destination executes the move then posts a message to the AI Web Worker.

**Todo List**

1. Create `src/hooks/useChessGame.ts`.
2. Implement state: `Chess` instance, `selectedSquare`, `playerColor`, `difficulty`.
3. Derive `legalMoves`, `lastMove`, `status`, `history`, `capturedPieces` from the Chess instance.
4. Implement `selectSquare`: on first click select piece and compute legal moves; on second click attempt move; deselect on illegal target.
5. After the player's move, post `{ fen, depth }` to the AI Web Worker; set `isComputerThinking = true`; on worker response apply the move and set `isComputerThinking = false`.

**Relevant Context**

- chess.js API: `game.moves({ square, verbose: true })`, `game.move({ from, to, promotion })`, `game.fen()`, `game.history({ verbose: true })`, `game.isCheckmate()`, `game.isStalemate()`, `game.isDraw()`, `game.isCheck()`.
- Pawn promotion: always auto-promote to queen for simplicity.

**Status** `[ ] pending`

---

### Sub-Task 3 — Minimax AI Engine + Web Worker

**Intent**
Implement a Minimax engine with alpha-beta pruning and a material + position evaluation function. Run it inside a **Web Worker** so the main thread (and React UI) stays unblocked during deep searches at Hard difficulty.

**Expected Outcomes**

- `src/engine/minimax.ts` exports `getBestMove(fen: string, depth: number): string` operating on a FEN string (so it can be imported by the worker without React dependencies).
- `src/engine/chessWorker.ts` is the worker entry point: listens for `{ fen, depth }` messages and posts back `{ bestMove }`.
- `src/hooks/useChessGame.ts` spawns the worker via `new Worker(new URL('../engine/chessWorker.ts', import.meta.url), { type: 'module' })` and communicates via `postMessage` / `onmessage`.
- A `isComputerThinking` boolean is exposed from the hook to allow the UI to show a thinking indicator and block player input while the worker is running.
- Evaluation weighs material (standard piece values) plus piece-square table bonuses for positional play.
- Alpha-beta pruning significantly reduces the search tree.
- Depth map: Easy → 1, Medium → 3, Hard → 5.

**Todo List**

1. Create `src/engine/minimax.ts` accepting a FEN string (reconstructs `Chess` from FEN internally).
2. Define piece values: P=100, N=320, B=330, R=500, Q=900, K=20000.
3. Add piece-square tables for each piece type (standard PST values).
4. Implement `evaluateBoard(game)`: sum material + PST for all pieces.
5. Implement `minimax(game, depth, alpha, beta, isMaximising)` recursively.
6. Export `getBestMove(fen, depth)`: reconstruct `Chess` from FEN, iterate root moves, pick the best by minimax score.
7. Create `src/engine/chessWorker.ts`: import `getBestMove`, handle `message` event with `{ fen, depth }`, post back `{ bestMove }`.
8. Update `useChessGame` hook to use `new Worker(...)` instead of a direct `setTimeout` call; set `isComputerThinking = true` before posting, `false` on receiving the result.

**Relevant Context**

- Vite natively supports Web Workers with `new Worker(new URL(...), { type: 'module' })` — no extra config needed.
- chess.js `.moves()` returns all legal moves as strings; use `game.move(m)` / `game.undo()` for tree traversal.
- Worker must import `chess.js` directly (it has no DOM dependencies, so this is safe).
- Only one worker message should be in-flight at a time; the hook should ignore stale responses if a new game started.

**Status** `[ ] pending`

---

### Sub-Task 4 — SVG Chess Pieces

**Intent**  
Provide high-quality SVG chess piece assets as React components so they render crisply at any size.

**Expected Outcomes**

- `src/components/pieces/` contains one `.tsx` file per piece (12 total: wK, wQ, wR, wB, wN, wP, bK, bQ, bR, bB, bN, bP).
- Each piece component accepts `size` prop.
- A barrel export `src/components/pieces/index.ts` maps `{ color, type } → Component`.

**Todo List**

1. Create `src/components/pieces/` directory with individual piece SVG components using standard open-source chess piece SVG paths (e.g. Wikimedia Commons SVG paths).
2. Create `src/components/pieces/index.ts` with a lookup map.

**Relevant Context**

- Use the Wikipedia / Wikimedia Commons SVG piece set (public domain) as the SVG path source.
- chess.js piece type values: `'p' | 'n' | 'b' | 'r' | 'q' | 'k'`, color `'w' | 'b'`.

**Status** `[ ] pending`

---

### Sub-Task 5 — Chessboard Component

**Intent**  
Build the interactive 8×8 board as a React component that renders squares, pieces, move highlights, and handles click interactions.

**Expected Outcomes**

- `src/components/Board.tsx` renders an 8×8 grid.
- Light/dark square colouring based on rank + file parity.
- Rank (1–8) and file (a–h) coordinate labels on the board edges.
- Selected square has a distinct highlight ring.
- Legal destination squares show a dot overlay (for empty squares) or a ring overlay (for capture squares).
- Last-move squares (from + to) have a subtle tint.
- Clicking a square calls `selectSquare(sq)` from the hook.
- Board is flipped when the player plays as Black.

**Todo List**

1. Create `src/components/Board.tsx`.
2. Render 64 `Square` sub-components arranged in a grid.
3. Pass highlight props (selected, isLegalMove, isCapture, isLastMove) to each square.
4. Render the correct piece SVG component on occupied squares.
5. Apply board-flip transform when `playerColor === 'b'`.
6. Style using CSS modules or scoped CSS (no external UI library).

**Relevant Context**

- chess.js `game.get(square)` returns `{ type, color } | null`.
- Square names in chess.js: `'a1'` … `'h8'`.
- Board flip: render ranks 1–8 (bottom-to-top for white, top-to-bottom for black).

**Status** `[ ] pending`

---

### Sub-Task 6 — Sidebar Panel (Captured Pieces + Move History)

**Intent**  
Build the right-side panel that displays captured pieces grouped by side and the full move history.

**Expected Outcomes**

- `src/components/Sidebar.tsx` renders two sections: **Captured Pieces** and **Move History**.
- Captured pieces are grouped (White's captures / Black's captures) with small piece icons and a material count difference.
- Move history shows moves in standard algebraic notation, paired by full move number (e.g. `1. e4  e5`).
- The history list auto-scrolls to the latest move.

**Todo List**

1. Create `src/components/Sidebar.tsx`.
2. Render captured pieces from the `capturedPieces` data in the hook.
3. Render move history from `history`.
4. Auto-scroll the history container to the bottom on each new move.

**Relevant Context**

- `capturedPieces` is derived in `useChessGame`: iterate `game.history({ verbose: true })` and track captures.
- Move history from `game.history()` returns SAN strings.

**Status** `[ ] pending`

---

### Sub-Task 7 — Game Setup Screen & Status Bar

**Intent**  
Build a pre-game setup screen where the player selects their colour and difficulty, and an in-game status bar showing whose turn it is, check/checkmate/draw state, and a "New Game" button.

**Expected Outcomes**

- `src/components/SetupScreen.tsx`: colour picker (White / Black) + difficulty selector (Easy / Medium / Hard) + "Start Game" button.
- `src/components/StatusBar.tsx`: shows turn indicator, game status message, and "New Game" button that returns to the setup screen.
- `App.tsx` switches between `SetupScreen` and the game view based on a `gameStarted` boolean.

**Todo List**

1. Create `src/components/SetupScreen.tsx` with colour and difficulty selection.
2. Create `src/components/StatusBar.tsx`.
3. Update `src/App.tsx` to wire together `SetupScreen`, `Board`, `Sidebar`, and `StatusBar`.

**Relevant Context**

- `App.tsx` holds top-level state: `gameStarted`, `playerColor`, `difficulty`.
- On "Start Game", call `resetGame(playerColor, difficulty)` from the hook.

**Status** `[ ] pending`

---

### Sub-Task 8 — Styling & Polish

**Intent**  
Apply cohesive styling across all components: board proportions, dark theme, responsive layout, hover/transition effects, and accessibility improvements.

**Expected Outcomes**

- Board renders as a perfect square that scales with viewport.
- Dark background with cream/brown board colours and subtle shadows.
- Hover state on legal move squares.
- Smooth piece-move transitions (CSS).
- Responsive layout: board + sidebar stack vertically on narrow screens.
- Keyboard-accessible square selection (not required for MVP but at least focusable).

**Todo List**

1. Finalize `src/index.css` with CSS custom properties (colour tokens, spacing scale).
2. Add component-level CSS modules or scoped styles for `Board`, `Sidebar`, `StatusBar`, `SetupScreen`.
3. Add hover and active state transitions on squares.
4. Add responsive breakpoint so board stacks above sidebar on mobile.

**Relevant Context**

- No external UI library — pure CSS.
- Target a polished dark-mode look as default.

**Status** `[ ] pending`

---

## Dependency Order

```
Sub-Task 1 (scaffold)
    → Sub-Task 3 (minimax engine + Web Worker)   [pure, no React dep]
    → Sub-Task 2 (game hook)                     [uses worker]
        → Sub-Task 4 (SVG pieces)                [used inside board]
        → Sub-Task 5 (board component)           [consumes hook]
        → Sub-Task 6 (sidebar)                   [consumes hook]
        → Sub-Task 7 (setup + status)            [wires everything in App]
            → Sub-Task 8 (styling)
```
