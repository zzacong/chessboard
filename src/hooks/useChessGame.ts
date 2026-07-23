import type { Square } from "chess.js";

import { Chess } from "chess.js";
import { useCallback, useEffect, useRef, useState } from "react";

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

interface UseChessGameReturn {
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
  selectSquare: (sq: Square) => void;
  resetGame: (
    color: PieceColor,
    difficulty: Difficulty,
    mode: GameMode,
    difficultyBlack?: Difficulty,
  ) => void;
  togglePause: () => void;
}

// Unique ID for each worker message to avoid stale responses
let msgId = 0;

function buildCapturedPieces(game: Chess): CapturedPieces {
  const captured: CapturedPieces = { w: [], b: [] };
  for (const move of game.history({ verbose: true })) {
    if (move.captured) {
      // The side that moved captured a piece of the other color
      // move.color is the mover; captured piece belongs to the other side
      const capturingColor = move.color as PieceColor;
      captured[capturingColor].push(move.captured as PieceType);
    }
  }
  return captured;
}

function deriveStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) return "checkmate";
  if (game.isStalemate()) return "stalemate";
  if (game.isDraw()) return "draw";
  if (game.isCheck()) return "check";
  return "playing";
}

export function useChessGame(): UseChessGameReturn {
  const gameRef = useRef<Chess>(new Chess());
  const workerRef = useRef<Worker | null>(null);
  const pendingMsgId = useRef<number>(-1);

  const [fen, setFen] = useState<string>(gameRef.current.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [history, setHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({
    w: [],
    b: [],
  });
  const [playerColor, setPlayerColor] = useState<PieceColor>("w");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [difficultyBlack, setDifficultyBlack] = useState<Difficulty>("medium");
  const [gameMode, setGameMode] = useState<GameMode>("vs-computer");
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Refs to mirror state for use inside callbacks without stale closures
  const gameModeRef = useRef<GameMode>("vs-computer");
  const difficultyRef = useRef<Difficulty>("medium");
  const difficultyBlackRef = useRef<Difficulty>("medium");
  const isPausedRef = useRef(false);

  // ── Sync derived state from game ──────────────────────────────────────────
  const syncState = useCallback(() => {
    const g = gameRef.current;
    setFen(g.fen());
    setStatus(deriveStatus(g));
    setHistory(g.history());
    setCapturedPieces(buildCapturedPieces(g));
  }, []);

  // ── Spawn worker once ─────────────────────────────────────────────────────
  useEffect(() => {
    const worker = new Worker(new URL("../engine/chessWorker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (e: MessageEvent<{ bestMove: string; id: number }>) => {
      const { bestMove, id } = e.data;
      // Ignore stale responses (e.g. after a game reset)
      if (id !== pendingMsgId.current) return;

      setIsComputerThinking(false);
      if (!bestMove) return;

      const g = gameRef.current;
      if (g.isGameOver()) return;

      g.move(bestMove);
      const hist = g.history({ verbose: true });
      const last = hist[hist.length - 1];
      if (last) setLastMove({ from: last.from as Square, to: last.to as Square });
      syncState();

      // In CvC mode, automatically schedule the next computer move
      if (
        gameModeRef.current === "computer-vs-computer" &&
        !g.isGameOver() &&
        !isPausedRef.current
      ) {
        const nextDiff = g.turn() === "w" ? difficultyRef.current : difficultyBlackRef.current;
        const nextId = ++msgId;
        pendingMsgId.current = nextId;
        setTimeout(() => {
          if (nextId !== pendingMsgId.current) return; // guard against reset during delay
          setIsComputerThinking(true);
          worker.postMessage({
            fen: g.fen(),
            depth: DEPTH_MAP[nextDiff],
            id: nextId,
          });
        }, 150);
      }
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, [syncState]);

  // ── Trigger computer move ─────────────────────────────────────────────────
  const triggerComputerMove = useCallback(
    (
      currentPlayerColor: PieceColor,
      currentDifficulty: Difficulty,
      currentDifficultyBlack: Difficulty,
      currentMode: GameMode,
    ) => {
      const g = gameRef.current;
      if (g.isGameOver()) return;
      // In vs-computer mode, only move when it's NOT the player's turn
      if (currentMode === "vs-computer" && g.turn() === currentPlayerColor) return;

      // Pick depth based on which side is about to move
      const depth =
        g.turn() === "b" ? DEPTH_MAP[currentDifficultyBlack] : DEPTH_MAP[currentDifficulty];

      setIsComputerThinking(true);
      const id = ++msgId;
      pendingMsgId.current = id;
      workerRef.current?.postMessage({ fen: g.fen(), depth, id });
    },
    [],
  );

  // ── selectSquare ──────────────────────────────────────────────────────────
  const selectSquare = useCallback(
    (sq: Square) => {
      const g = gameRef.current;
      if (g.isGameOver() || isComputerThinking) return;
      if (gameMode === "computer-vs-computer") return; // view-only in CvC

      if (gameMode === "vs-computer" && g.turn() !== playerColor) return; // not player's turn

      // In multiplayer, allow whichever color's turn it is to select their own pieces
      const activeColor = gameMode === "multiplayer" ? g.turn() : playerColor;

      // If a square is already selected and we're clicking a legal destination
      if (selectedSquare && legalMoveSquares.includes(sq)) {
        const moveResult = g.move({
          from: selectedSquare,
          to: sq,
          promotion: "q",
        });
        if (moveResult) {
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);
          setLegalMoveSquares([]);
          syncState();
          // Only trigger AI move in vs-computer mode
          if (gameMode === "vs-computer") {
            setTimeout(
              () => triggerComputerMove(playerColor, difficulty, difficultyBlack, gameMode),
              150,
            );
          }
          return;
        }
      }

      // Select a new piece belonging to the active color
      const piece = g.get(sq);
      if (piece && piece.color === activeColor) {
        setSelectedSquare(sq);
        const moves = g.moves({ square: sq, verbose: true });
        setLegalMoveSquares(moves.map((m) => m.to as Square));
      } else {
        // Clicked empty or opponent piece without a selected piece — deselect
        setSelectedSquare(null);
        setLegalMoveSquares([]);
      }
    },
    [
      selectedSquare,
      legalMoveSquares,
      playerColor,
      difficulty,
      difficultyBlack,
      gameMode,
      isComputerThinking,
      syncState,
      triggerComputerMove,
    ],
  );

  // ── resetGame ─────────────────────────────────────────────────────────────
  const resetGame = useCallback(
    (color: PieceColor, diff: Difficulty, mode: GameMode, diffBlack: Difficulty = "medium") => {
      // Invalidate any in-flight worker message
      pendingMsgId.current = ++msgId;

      gameRef.current = new Chess();
      setPlayerColor(color);
      setDifficulty(diff);
      setDifficultyBlack(diffBlack);
      setGameMode(mode);
      setSelectedSquare(null);
      setLegalMoveSquares([]);
      setLastMove(null);
      setIsComputerThinking(false);
      setIsPaused(false);

      // Keep refs in sync
      gameModeRef.current = mode;
      difficultyRef.current = diff;
      difficultyBlackRef.current = diffBlack;
      isPausedRef.current = false;

      syncState();

      if (mode === "computer-vs-computer") {
        // White always moves first in CvC
        setTimeout(() => triggerComputerMove(color, diff, diffBlack, mode), 300);
      } else if (mode === "vs-computer" && color === "b") {
        // Player chose black — computer (white) goes first
        setTimeout(() => triggerComputerMove(color, diff, diffBlack, mode), 300);
      }
    },
    [syncState, triggerComputerMove],
  );

  // ── togglePause ───────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    const g = gameRef.current;
    const nowPaused = !isPausedRef.current;
    isPausedRef.current = nowPaused;
    setIsPaused(nowPaused);

    if (!nowPaused && !g.isGameOver()) {
      // Resumed — trigger the next move immediately
      triggerComputerMove(
        "w",
        difficultyRef.current,
        difficultyBlackRef.current,
        gameModeRef.current,
      );
    }
  }, [triggerComputerMove]);

  return {
    fen,
    turn: gameRef.current.turn() as PieceColor,
    selectedSquare,
    legalMoveSquares,
    lastMove,
    status,
    history,
    capturedPieces,
    playerColor,
    difficulty,
    difficultyBlack,
    gameMode,
    isComputerThinking,
    isPaused,
    selectSquare,
    resetGame,
    togglePause,
  };
}
