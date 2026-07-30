import type { Square } from "chess.js";

import { Chess } from "chess.js";
import { createStore, useStore } from "zustand";
import { devtools } from "zustand/middleware";

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

import { DEPTH_MAP, SKILL_MAP } from "@/types";

// ── Module-level non-reactive state ──────────────────────────────────────────
// These don't need to trigger re-renders so they live outside Zustand.

let game = new Chess();

let workerV1: Worker | null = null;
let workerV2: Worker | null = null;

let msgId = 0;
let pendingMsgId = -1;

// Stockfish communicates through UCI strings, not JSON objects.
// A search must be handled sequentially because Stockfish's `bestmove` response
// does not include an application-level request ID.
let stockfishReady = false;
let stockfishBusy = false;
let stockfishStopRequested = false;
let stockfishActiveId = -1;

interface StockfishSearch {
  id: number;
  fen: string;
  skillLevel: number;
}

let queuedStockfishSearch: StockfishSearch | null = null;

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

function stopStockfish() {
  queuedStockfishSearch = null;

  if (stockfishBusy && !stockfishStopRequested) {
    stockfishStopRequested = true;
    workerV2?.postMessage("stop");
  }
}

function startQueuedStockfishSearch() {
  if (!workerV2 || !stockfishReady || stockfishBusy) return;

  const search = queuedStockfishSearch;
  if (!search) return;

  queuedStockfishSearch = null;
  stockfishBusy = true;
  stockfishStopRequested = false;
  stockfishActiveId = search.id;

  workerV2.postMessage(`setoption name Skill Level value ${search.skillLevel}`);
  workerV2.postMessage(`position fen ${search.fen}`);
  workerV2.postMessage("go depth 12");
}

function requestStockfishMove(search: StockfishSearch) {
  queuedStockfishSearch = search;

  if (stockfishBusy) {
    if (!stockfishStopRequested) {
      stockfishStopRequested = true;
      workerV2?.postMessage("stop");
    }

    return;
  }

  startQueuedStockfishSearch();
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
      triggerComputerMove: (
        currentPlayerColor,
        currentDifficulty,
        currentDifficultyBlack,
        currentMode,
      ) => {
        const { engineVersion, isPaused, isComputerThinking } = get();

        if (game.isGameOver() || isPaused || isComputerThinking) return;

        if (currentMode === "vs-computer" && game.turn() === currentPlayerColor) {
          return;
        }

        set({ isComputerThinking: true });

        const id = ++msgId;
        pendingMsgId = id;

        const activeDifficulty = game.turn() === "b" ? currentDifficultyBlack : currentDifficulty;

        if (engineVersion === "v2") {
          requestStockfishMove({
            id,
            fen: game.fen(),
            skillLevel: SKILL_MAP[activeDifficulty],
          });

          return;
        }

        const depth = DEPTH_MAP[activeDifficulty];

        workerV1?.postMessage({
          fen: game.fen(),
          depth,
          id,
        });
      },

      selectSquare: (sq) => {
        const {
          selectedSquare,
          legalMoveSquares,
          playerColor,
          difficulty,
          difficultyBlack,
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
                triggerComputerMove(playerColor, difficulty, difficultyBlack, gameMode);
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
        stopStockfish();

        game = new Chess();

        if (stockfishReady) {
          workerV2?.postMessage("ucinewgame");
          workerV2?.postMessage("isready");
        }

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
            get().triggerComputerMove(color, diff, diffBlack, mode);
          }, 300);

          return;
        }

        if (mode === "vs-computer" && color === "b") {
          setTimeout(() => {
            get().triggerComputerMove(color, diff, diffBlack, mode);
          }, 300);
        }
      },

      undoMove: () => {
        const { gameMode, playerColor, isComputerThinking } = get();

        if (isComputerThinking) return;

        pendingMsgId = ++msgId;
        stopStockfish();

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
          const { difficulty, difficultyBlack } = get();

          setTimeout(() => {
            get().triggerComputerMove(playerColor, difficulty, difficultyBlack, gameMode);
          }, 150);
        }
      },

      togglePause: () => {
        const { isPaused, triggerComputerMove } = get();
        const nowPaused = !isPaused;

        set({ isPaused: nowPaused });

        if (nowPaused) {
          pendingMsgId = ++msgId;
          stopStockfish();
          set({ isComputerThinking: false });
          return;
        }

        if (!game.isGameOver()) {
          const { difficulty, difficultyBlack, gameMode, playerColor } = get();

          triggerComputerMove(playerColor, difficulty, difficultyBlack, gameMode);
        }
      },
    }),
    { name: "chess-store" },
  ),
);

// ── Computer move application ─────────────────────────────────────────────────

function scheduleNextComputerMove() {
  const { gameMode, isPaused, difficulty, difficultyBlack, playerColor } = chessStore.getState();

  if (gameMode !== "computer-vs-computer" || isPaused || game.isGameOver()) {
    return;
  }

  setTimeout(() => {
    const state = chessStore.getState();

    if (state.isPaused || game.isGameOver()) return;

    state.triggerComputerMove(playerColor, difficulty, difficultyBlack, gameMode);
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

// ── V1 minimax worker ─────────────────────────────────────────────────────────

interface MinimaxWorkerResponse {
  bestMove: string;
  id: number;
}

function handleMinimaxWorkerMessage(event: MessageEvent<MinimaxWorkerResponse>) {
  const { bestMove, id } = event.data;

  if (id !== pendingMsgId) return;

  if (!bestMove) {
    chessStore.setState({ isComputerThinking: false });
    return;
  }

  applyComputerMove(bestMove, id);
}

// ── V2 Stockfish UCI worker ───────────────────────────────────────────────────

function handleStockfishMessage(event: MessageEvent<string>) {
  const line = String(event.data).trim();

  // Enable this while debugging Stockfish startup/network problems.
  // console.debug("[Stockfish]", line);

  if (line === "uciok") {
    workerV2?.postMessage("isready");
    return;
  }

  if (line === "readyok") {
    stockfishReady = true;
    startQueuedStockfishSearch();
    return;
  }

  if (!line.startsWith("bestmove")) return;

  const activeId = stockfishActiveId;
  const bestMove = line.split(/\s+/)[1];

  stockfishBusy = false;
  stockfishStopRequested = false;
  stockfishActiveId = -1;

  // `bestmove (none)` is possible in terminal positions.
  if (bestMove && bestMove !== "(none)") {
    applyComputerMove(bestMove, activeId);
  } else if (activeId === pendingMsgId) {
    chessStore.setState({ isComputerThinking: false });
  }

  // If a newer request came in while Stockfish was searching, start it now.
  startQueuedStockfishSearch();
}

function createStockfishWorker(): Worker {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  const workerUrl = new URL("stockfish/stockfish-18-lite-single.js", baseUrl);
  const wasmUrl = new URL("stockfish/stockfish-18-lite-single.wasm", baseUrl);
  workerUrl.hash = encodeURIComponent(wasmUrl.href);
  return new Worker(workerUrl);
}

// ── Worker bootstrap ──────────────────────────────────────────────────────────

if (typeof window !== "undefined" && typeof Worker !== "undefined") {
  workerV1 = new Worker(new URL("../lib/engine/v1/minimaxWorker.ts", import.meta.url), {
    type: "module",
  });

  workerV1.onmessage = handleMinimaxWorkerMessage;

  workerV1.onerror = (event) => {
    console.error("Minimax worker error:", event);
    chessStore.setState({ isComputerThinking: false });
  };

  workerV2 = createStockfishWorker();

  workerV2.onmessage = handleStockfishMessage;

  workerV2.onerror = (event) => {
    console.error("Stockfish worker error:", event);

    stockfishBusy = false;
    stockfishReady = false;
    stockfishActiveId = -1;

    chessStore.setState({ isComputerThinking: false });
  };

  // Start the Stockfish UCI handshake.
  workerV2.postMessage("uci");
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useChessStore<T>(selector: (state: ChessStore) => T): T {
  return useStore(chessStore, selector);
}

// ── Snapshot accessor (for use outside React, e.g. route guards) ──────────────

export function getChessState(): ChessStore {
  return chessStore.getState();
}
