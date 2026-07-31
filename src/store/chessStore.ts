import type { Square } from "chess.js";

import { Chess } from "chess.js";
import { createStore, useStore } from "zustand";
import { devtools } from "zustand/middleware";

import type { EngineOptions } from "@/lib/engine";
import type {
  CapturedPieces,
  Difficulty,
  EngineVersion,
  GameMode,
  GameStatus,
  LastMove,
  PieceColor,
  PieceType,
} from "@/types";

import { getEngine } from "@/lib/engine";
import { DEPTH_MAP, SKILL_MAP } from "@/types";

// ── Module-level non-reactive state ──────────────────────────────────────────
// These don't need to trigger re-renders so they live outside Zustand.

let game = new Chess();

let msgId = 0;
let pendingMsgId = -1;

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function parseUciMove(move: string): {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
} | null {
  const match = move.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);

  if (!match) return null;

  return {
    from: match[1] as Square,
    to: match[2] as Square,
    promotion: match[3] as "q" | "r" | "b" | "n" | undefined,
  };
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
  engineVersion: EngineVersion;
  isComputerThinking: boolean;
  isPaused: boolean;
  gameStarted: boolean;
}

interface ChessActions {
  syncState: () => void;
  triggerComputerMove: () => void;
  selectSquare: (sq: Square) => void;
  resetGame: (
    color: PieceColor,
    difficulty: Difficulty,
    mode: GameMode,
    difficultyBlack?: Difficulty,
    engineVersion?: EngineVersion,
  ) => void;
  togglePause: () => void;
  undoMove: () => void;
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
      engineVersion: "v1",
      isComputerThinking: false,
      isPaused: false,
      gameStarted: false,

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
      triggerComputerMove: () => {
        const {
          engineVersion,
          isPaused,
          isComputerThinking,
          playerColor,
          difficulty,
          difficultyBlack,
          gameMode,
        } = get();

        if (game.isGameOver() || isPaused || isComputerThinking) return;

        if (gameMode === "vs-computer" && game.turn() === playerColor) {
          return;
        }

        set({ isComputerThinking: true });

        const id = ++msgId;
        pendingMsgId = id;

        const activeDifficulty = game.turn() === "b" ? difficultyBlack : difficulty;
        const opts: EngineOptions = {
          depth: DEPTH_MAP[activeDifficulty],
          skillLevel: SKILL_MAP[activeDifficulty],
        };

        getEngine(engineVersion)
          .getBestMove(game.fen(), opts)
          .then((bestMove) => {
            if (id !== pendingMsgId) return;
            if (bestMove) {
              applyComputerMove(bestMove, id);
            } else {
              chessStore.setState({ isComputerThinking: false });
            }
          })
          .catch((err: unknown) => {
            if (id !== pendingMsgId) return;
            console.error("Engine error:", err);
            chessStore.setState({ isComputerThinking: false });
          });
      },

      selectSquare: (sq) => {
        const {
          selectedSquare,
          legalMoveSquares,
          playerColor,
          gameMode,
          isComputerThinking,
          isPaused,
          syncState,
          triggerComputerMove,
        } = get();

        if (game.isGameOver() || isComputerThinking || isPaused) return;
        if (gameMode === "computer-vs-computer") return;

        if (gameMode === "vs-computer" && game.turn() !== playerColor) {
          return;
        }

        const activeColor = gameMode === "multiplayer" ? game.turn() : playerColor;

        if (selectedSquare && legalMoveSquares.includes(sq)) {
          const moveResult = game.move({
            from: selectedSquare,
            to: sq,
            promotion: "q",
          });

          if (moveResult) {
            set({
              lastMove: {
                from: selectedSquare,
                to: sq,
              },
              selectedSquare: null,
              legalMoveSquares: [],
            });

            syncState();

            if (gameMode === "vs-computer") {
              setTimeout(() => {
                triggerComputerMove();
              }, 150);
            }

            return;
          }
        }

        const piece = game.get(sq);

        if (piece && piece.color === activeColor) {
          const moves = game.moves({
            square: sq,
            verbose: true,
          });

          set({
            selectedSquare: sq,
            legalMoveSquares: moves.map((move) => move.to as Square),
          });

          return;
        }

        set({
          selectedSquare: null,
          legalMoveSquares: [],
        });
      },

      resetGame: (color, diff, mode, diffBlack = "medium", engVersion = "v1") => {
        pendingMsgId = ++msgId;
        getEngine(engVersion).cancelSearch();

        game = new Chess();
        getEngine(engVersion).newGame?.();

        set({
          playerColor: color,
          difficulty: diff,
          difficultyBlack: diffBlack,
          gameMode: mode,
          engineVersion: engVersion,
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
          gameStarted: true,
        });

        if (mode === "computer-vs-computer") {
          setTimeout(() => {
            get().triggerComputerMove();
          }, 300);

          return;
        }

        if (mode === "vs-computer" && color === "b") {
          setTimeout(() => {
            get().triggerComputerMove();
          }, 300);
        }
      },

      undoMove: () => {
        const { gameMode, playerColor, isComputerThinking } = get();

        if (isComputerThinking) return;

        pendingMsgId = ++msgId;
        getEngine(get().engineVersion).cancelSearch();

        const plies = gameMode === "vs-computer" ? 2 : 1;

        for (let index = 0; index < plies; index += 1) {
          if (game.history().length === 0) break;
          game.undo();
        }

        const history = game.history({ verbose: true });
        const lastMove = history.at(-1);

        set({
          selectedSquare: null,
          legalMoveSquares: [],
          lastMove: lastMove
            ? {
                from: lastMove.from as Square,
                to: lastMove.to as Square,
              }
            : null,
        });

        get().syncState();

        if (gameMode === "vs-computer" && game.turn() !== playerColor && !game.isGameOver()) {
          setTimeout(() => {
            get().triggerComputerMove();
          }, 150);
        }
      },

      togglePause: () => {
        const { isPaused } = get();
        const nowPaused = !isPaused;

        set({ isPaused: nowPaused });

        if (nowPaused) {
          pendingMsgId = ++msgId;
          getEngine(get().engineVersion).cancelSearch();
          set({ isComputerThinking: false });
          return;
        }

        if (!game.isGameOver()) {
          get().triggerComputerMove();
        }
      },
    }),
    { name: "chess-store" },
  ),
);

// ── Computer move application ─────────────────────────────────────────────────

function scheduleNextComputerMove() {
  const { gameMode, isPaused } = chessStore.getState();

  if (gameMode !== "computer-vs-computer" || isPaused || game.isGameOver()) {
    return;
  }

  setTimeout(() => {
    const state = chessStore.getState();

    if (state.isPaused || game.isGameOver()) return;

    state.triggerComputerMove();
  }, 150);
}

function applyComputerMove(bestMove: string, id: number) {
  if (id !== pendingMsgId || game.isGameOver()) return;

  const move = parseUciMove(bestMove);

  if (!move) {
    console.error("Engine returned an invalid UCI move:", bestMove);
    chessStore.setState({ isComputerThinking: false });
    return;
  }

  try {
    game.move(move);
  } catch (error) {
    console.error("Engine returned an illegal move:", bestMove, error);
    chessStore.setState({ isComputerThinking: false });
    return;
  }

  const history = game.history({ verbose: true });
  const lastMove = history.at(-1);

  chessStore.setState({
    isComputerThinking: false,
    lastMove: lastMove
      ? {
          from: lastMove.from as Square,
          to: lastMove.to as Square,
        }
      : null,
  });

  chessStore.getState().syncState();
  scheduleNextComputerMove();
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useChessStore<T>(selector: (state: ChessStore) => T): T {
  return useStore(chessStore, selector);
}

// ── Snapshot accessor (for use outside React, e.g. route guards) ──────────────

export function getChessState(): ChessStore {
  return chessStore.getState();
}
