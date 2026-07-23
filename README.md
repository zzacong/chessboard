# Chessboard

A browser-based chess game (Player vs Computer) built with React, TypeScript, and Vite.

## Features

- **Three difficulty levels** — Easy, Medium, and Hard, powered by a Minimax engine with alpha-beta pruning
- **Choose your colour** — play as White or Black from a setup screen before each game
- **AI runs off the main thread** — the computer opponent uses a Web Worker so the UI stays responsive during deep searches
- **Move highlights** — selected piece, legal destinations, last move, and king-in-check indicators
- **Captured pieces tray** — grouped by side with material count
- **Move history** — full algebraic notation, auto-scrolling to the latest move
- **Responsive layout** — board and sidebar stack vertically on narrow screens

## Getting Started

**Prerequisites:** Node.js 18+ and [pnpm](https://pnpm.io)

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Lint with oxlint |
| `pnpm fmt` | Format with oxfmt |

## Tech Stack

- **[React 19](https://react.dev)** — UI
- **[TypeScript 6](https://www.typescriptlang.org)** — type safety
- **[Vite 8](https://vite.dev)** — dev server and bundler
- **[chess.js](https://github.com/jhlywa/chess.js)** — chess rules and move generation
- **[Tailwind CSS v4](https://tailwindcss.com)** — utility styling
- **[oxlint](https://oxc.rs/docs/guide/usage/linter) / [oxfmt](https://oxc.rs/docs/guide/usage/formatter)** — linting and formatting

## Project Structure

```
src/
├── App.tsx                  # Root component, game/setup screen routing
├── types.ts                 # Shared types and constants
├── index.css                # Design tokens, board square classes, keyframes
├── components/
│   ├── Board.tsx            # Interactive 8×8 board
│   ├── Sidebar.tsx          # Captured pieces + move history
│   ├── StatusBar.tsx        # Turn indicator, game status, New Game button
│   ├── SetupScreen.tsx      # Colour and difficulty picker
│   └── pieces/              # SVG chess piece components
├── hooks/
│   └── useChessGame.ts      # All game state and worker communication
├── engine/
│   ├── minimax.ts           # Minimax with alpha-beta pruning
│   └── chessWorker.ts       # Web Worker entry point
└── lib/
    └── cn.ts                # clsx + tailwind-merge utility
```

## How It Works

All game state lives in the [`useChessGame`](src/hooks/useChessGame.ts) hook. Components are purely presentational and receive data and callbacks as props.

When the player makes a move, the hook posts a `{ fen, depth, id }` message to a long-lived Web Worker running the Minimax engine. The worker responds with the best move, which is applied to the game. Stale responses (e.g. after a game reset) are silently discarded via a monotonic message ID.

Difficulty maps directly to search depth:

| Difficulty | Minimax depth |
|---|---|
| Easy | 1 |
| Medium | 3 |
| Hard | 5 |
