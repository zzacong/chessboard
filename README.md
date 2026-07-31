# Chessboard

A browser-based chess game (Player vs Computer) built with React, TypeScript, and Vite.

## Features

- **Three game modes** — vs Computer, Local 2 Player (hot-seat), and CPU vs CPU (watch two AIs play)
- **Two engines** — Minimax v1 (alpha-beta pruning, configurable depth) and Stockfish v2 (UCI, skill-level 0–20)
- **Three difficulty levels** — Easy, Medium, and Hard for each engine/side
- **Choose your colour** — play as White or Black before each game (or set independent difficulty per side in CPU vs CPU)
- **AI runs off the main thread** — both engines use Web Workers so the UI stays responsive
- **Move highlights** — selected piece, legal destinations, last move, and king-in-check indicators
- **Captured pieces tray** — grouped by side with material count
- **Move history** — full algebraic notation, auto-scrolling to the latest move
- **Undo** — step back one full move (player + computer ply) in vs-computer mode
- **Pause / Resume** — freeze CPU vs CPU games mid-match
- **Responsive layout** — board and sidebar stack vertically on narrow screens

## Getting Started

**Prerequisites:** Node.js 18+ and [pnpm](https://pnpm.io)

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `pnpm dev`         | Start development server (also runs TanStack Router codegen) |
| `pnpm build`       | Type-check and build for production                     |
| `pnpm preview`     | Preview the production build locally                    |
| `pnpm typecheck`   | Run TypeScript type checking                            |
| `pnpm lint`        | Lint with oxlint                                        |
| `pnpm fmt`         | Format with oxfmt (auto-fix)                            |
| `pnpm fmt:check`   | Check formatting without writing                        |
| `pnpm test`        | Run tests once (Vitest)                                 |
| `pnpm test:watch`  | Run tests in watch mode                                 |
| `pnpm check`       | Full validation gate (fmt:check + typecheck + lint + test) |

## Tech Stack

- **[React 19](https://react.dev)** — UI (with React Compiler via Babel)
- **[TypeScript 6](https://www.typescriptlang.org)** — type safety
- **[Vite 8](https://vite.dev)** — dev server and bundler
- **[chess.js](https://github.com/jhlywa/chess.js)** — chess rules and move generation
- **[Tailwind CSS v4](https://tailwindcss.com)** — utility styling
- **[Zustand 5](https://zustand.docs.pmnd.rs)** — global game state management
- **[TanStack Router](https://tanstack.com/router)** — file-based client-side routing
- **[Vitest](https://vitest.dev)** — unit testing
- **[oxlint](https://oxc.rs/docs/guide/usage/linter) / [oxfmt](https://oxc.rs/docs/guide/usage/formatter)** — linting and formatting

## Project Structure

```
src/
├── main.tsx                 # App entry point — mounts RouterProvider
├── types.ts                 # Shared types and constants (DEPTH_MAP, SKILL_MAP, GameStatus…)
├── index.css                # Design tokens, board square classes, keyframes
├── routes/
│   ├── __root.tsx           # Root layout
│   ├── index.tsx            # / — setup UI (engine, mode, colour, difficulty pickers)
│   ├── v1/game.tsx          # /v1/game — Minimax game view
│   └── v2/game.tsx          # /v2/game — Stockfish game view
├── components/
│   ├── GameLayout.tsx       # Shared game shell (header, board, sidebar)
│   ├── Board.tsx            # Interactive 8×8 board
│   ├── Sidebar.tsx          # Captured pieces + move history
│   ├── StatusBar.tsx        # Turn indicator, game status, Undo/Pause/New Game buttons
│   └── pieces/              # SVG chess piece components
├── store/
│   └── chessStore.ts        # Zustand store — all game state and engine orchestration
├── lib/
│   ├── cn.ts                # clsx + tailwind-merge utility
│   └── engine/
│       ├── index.ts         # Engine interface, EngineOptions, getEngine() factory
│       ├── v1/minimaxEngine.ts   # Minimax engine (web worker)
│       ├── v1/minimaxWorker.ts   # Worker entry point
│       ├── v1/minimax.ts         # Minimax algorithm with alpha-beta pruning
│       └── v2/stockfish.ts       # Stockfish UCI engine (pre-built WASM worker)
└── test/                    # Vitest unit tests
```

## How It Works

All game state lives in the Zustand store ([`src/store/chessStore.ts`](src/store/chessStore.ts)). Components subscribe to the slices they need via `useChessStore(selector)`.

Both engines implement a common [`Engine`](src/lib/engine/index.ts) interface and are selected at game start via `getEngine(version)`. When a computer move is needed, the store calls `engine.getBestMove(fen, opts)` — a Promise that resolves when the worker responds. Stale responses are discarded via a monotonic `msgId` / `pendingMsgId` pair.

Difficulty maps to search depth (Minimax v1) or skill level (Stockfish v2):

| Difficulty | Minimax depth | Stockfish skill |
| ---------- | ------------- | --------------- |
| Easy       | 1             | 3               |
| Medium     | 3             | 10              |
| Hard       | 5             | 20              |
