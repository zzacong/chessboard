import type { Square } from "chess.js";

import { Chess } from "chess.js";
import { createStore, useStore } from "zustand";
import { devtools } from "zustand/middleware";

import type {
  CapturedPieces,
  Difficulty,
  GameMode,
  GameStatus,
  LastMove,
  PieceColor,
  PieceType,
} from "../types";

import { DEPTH_MAP } from "../types";

// ── Module-level non-reactive state ──────────────────────────────────────────
// These don't need to trigger re-renders so they live outside Zustand.
let game = new Chess();
let worker: Worker | null = null;
let msgId = 0;
let pendingMsgId = -1;

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildCapturedPieces(g: Chess): CapturedPieces {
  const captured: CapturedPieces = { w: [], b: [] };
  for (const move of g.history({ verbose: true })) {
    if (move.captured) {
      const capturingColor = move.color as PieceColor;
      captured[capturingColor].push(move.captured as PieceType);
    }
  }
  return captured;
}

function deriveStatus(g: Chess): GameStatus {
  if (g.isCheckmate()) return "checkmate";
  if (g.isStalemate()) return "stalemate";
  if (g.isDraw()) return "draw";
  if (g.isCheck()) return "check";
  return "playing";
}

// ── Store types ───────────────────────────────────────────────────────────────
interface ChessState {
  fen: string;
  turn: PieceColor;
  selectedSquare: Square | null;
  legalMoveSquares: Square[];
  lastMove: LastMove | null;
  status: GameStatus;
  history: string[];
  capturedPieces: CapturedPieces;
  playerColor: PieceColor;
  difficulty: Difficulty;
  difficultyBlack: Difficulty;
  gameMode: GameMode;
  isComputerThinking: boolean;
  isPaused: boolean;
}

interface ChessActions {
  syncState: () => void;
  triggerComputerMove: (
    currentPlayerColor: PieceColor,
    currentDifficulty: Difficulty,
    currentDifficultyBlack: Difficulty,
    currentMode: GameMode,
  ) => void;
  selectSquare: (sq: Square) => void;
  resetGame: (
    color: PieceColor,
    difficulty: Difficulty,
    mode: GameMode,
    difficultyBlack?: Difficulty,
  ) => void;
  togglePause: () => void;
}

type ChessStore = ChessState & ChessActions;

// ── Store ─────────────────────────────────────────────────────────────────────
const chessStore = createStore<ChessStore>()(
  devtools(
    (set, get) => ({
      // ── Initial state ───────────────────────────────────────────────────────
      fen: game.fen(),
      turn: game.turn() as PieceColor,
      selectedSquare: null,
      legalMoveSquares: [],
      lastMove: null,
      status: "playing",
      history: [],
      capturedPieces: { w: [], b: [] },
      playerColor: "w",
      difficulty: "medium",
      difficultyBlack: "medium",
      gameMode: "vs-computer",
      isComputerThinking: false,
      isPaused: false,

      // ── syncState ───────────────────────────────────────────────────────────
      syncState: () => {
        set({
          fen: game.fen(),
          turn: game.turn() as PieceColor,
          status: deriveStatus(game),
          history: game.history(),
          capturedPieces: buildCapturedPieces(game),
        });
      },

      // ── triggerComputerMove ─────────────────────────────────────────────────
      triggerComputerMove: (
        currentPlayerColor,
        currentDifficulty,
        currentDifficultyBlack,
        currentMode,
      ) => {
        if (game.isGameOver()) return;
        if (currentMode === "vs-computer" && game.turn() === currentPlayerColor) return;

        const depth =
          game.turn() === "b" ? DEPTH_MAP[currentDifficultyBlack] : DEPTH_MAP[currentDifficulty];

        set({ isComputerThinking: true });
        const id = ++msgId;
        pendingMsgId = id;
        worker?.postMessage({ fen: game.fen(), depth, id });
      },

      // ── selectSquare ────────────────────────────────────────────────────────
      selectSquare: (sq: Square) => {
        const {
          selectedSquare,
          legalMoveSquares,
          playerColor,
          difficulty,
          difficultyBlack,
          gameMode,
          isComputerThinking,
          syncState,
          triggerComputerMove,
        } = get();

        if (game.isGameOver() || isComputerThinking) return;
        if (gameMode === "computer-vs-computer") return;
        if (gameMode === "vs-computer" && game.turn() !== playerColor) return;

        const activeColor = gameMode === "multiplayer" ? game.turn() : playerColor;

        if (selectedSquare && legalMoveSquares.includes(sq)) {
          const moveResult = game.move({ from: selectedSquare, to: sq, promotion: "q" });
          if (moveResult) {
            set({
              lastMove: { from: selectedSquare, to: sq },
              selectedSquare: null,
              legalMoveSquares: [],
            });
            syncState();
            if (gameMode === "vs-computer") {
              setTimeout(
                () => triggerComputerMove(playerColor, difficulty, difficultyBlack, gameMode),
                150,
              );
            }
            return;
          }
        }

        const piece = game.get(sq);
        if (piece && piece.color === activeColor) {
          const moves = game.moves({ square: sq, verbose: true });
          set({
            selectedSquare: sq,
            legalMoveSquares: moves.map((m) => m.to as Square),
          });
        } else {
          set({ selectedSquare: null, legalMoveSquares: [] });
        }
      },

      // ── resetGame ───────────────────────────────────────────────────────────
      resetGame: (color, diff, mode, diffBlack = "medium") => {
        pendingMsgId = ++msgId;
        game = new Chess();

        set({
          playerColor: color,
          difficulty: diff,
          difficultyBlack: diffBlack,
          gameMode: mode,
          selectedSquare: null,
          legalMoveSquares: [],
          lastMove: null,
          isComputerThinking: false,
          isPaused: false,
          fen: game.fen(),
          turn: game.turn() as PieceColor,
          status: "playing",
          history: [],
          capturedPieces: { w: [], b: [] },
        });

        if (mode === "computer-vs-computer") {
          setTimeout(() => get().triggerComputerMove(color, diff, diffBlack, mode), 300);
        } else if (mode === "vs-computer" && color === "b") {
          setTimeout(() => get().triggerComputerMove(color, diff, diffBlack, mode), 300);
        }
      },

      // ── togglePause ─────────────────────────────────────────────────────────
      togglePause: () => {
        const { isPaused, triggerComputerMove } = get();
        const nowPaused = !isPaused;
        set({ isPaused: nowPaused });

        if (!nowPaused && !game.isGameOver()) {
          const { difficulty, difficultyBlack, gameMode } = get();
          triggerComputerMove("w", difficulty, difficultyBlack, gameMode);
        }
      },
    }),
    { name: "chess-store" },
  ),
);

// ── Worker bootstrap (once at module load) ────────────────────────────────────
worker = new Worker(new URL("../lib/engine/chessWorker.ts", import.meta.url), { type: "module" });

worker.onmessage = (e: MessageEvent<{ bestMove: string; id: number }>) => {
  const { bestMove, id } = e.data;
  if (id !== pendingMsgId) return;

  const { syncState, triggerComputerMove } = chessStore.getState();

  chessStore.setState({ isComputerThinking: false });
  if (!bestMove) return;
  if (game.isGameOver()) return;

  game.move(bestMove);
  const hist = game.history({ verbose: true });
  const last = hist[hist.length - 1];
  if (last) chessStore.setState({ lastMove: { from: last.from as Square, to: last.to as Square } });
  syncState();

  const { gameMode, isPaused, difficulty, difficultyBlack } = chessStore.getState();

  if (gameMode === "computer-vs-computer" && !game.isGameOver() && !isPaused) {
    const nextDiff = game.turn() === "w" ? difficulty : difficultyBlack;
    const nextId = ++msgId;
    pendingMsgId = nextId;
    setTimeout(() => {
      if (nextId !== pendingMsgId) return;
      triggerComputerMove("w", difficulty, nextDiff, gameMode);
    }, 150);
  }
};

// ── React hook ────────────────────────────────────────────────────────────────
export function useChessStore<T>(selector: (state: ChessStore) => T): T {
  return useStore(chessStore, selector);
}
