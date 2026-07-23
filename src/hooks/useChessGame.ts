import type { Square } from "chess.js";

import { Chess } from "chess.js";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CapturedPieces,
  Difficulty,
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
  isComputerThinking: boolean;
  selectSquare: (sq: Square) => void;
  resetGame: (color: PieceColor, difficulty: Difficulty) => void;
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
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({ w: [], b: [] });
  const [playerColor, setPlayerColor] = useState<PieceColor>("w");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isComputerThinking, setIsComputerThinking] = useState(false);

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
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, [syncState]);

  // ── Trigger computer move ─────────────────────────────────────────────────
  const triggerComputerMove = useCallback(
    (currentPlayerColor: PieceColor, currentDifficulty: Difficulty) => {
      const g = gameRef.current;
      if (g.isGameOver()) return;
      if (g.turn() === currentPlayerColor) return; // it's the player's turn

      setIsComputerThinking(true);
      const id = ++msgId;
      pendingMsgId.current = id;
      workerRef.current?.postMessage({
        fen: g.fen(),
        depth: DEPTH_MAP[currentDifficulty],
        id,
      });
    },
    [],
  );

  // ── selectSquare ──────────────────────────────────────────────────────────
  const selectSquare = useCallback(
    (sq: Square) => {
      const g = gameRef.current;
      if (g.isGameOver() || isComputerThinking) return;
      if (g.turn() !== playerColor) return; // not player's turn

      // If a square is already selected and we're clicking a legal destination
      if (selectedSquare && legalMoveSquares.includes(sq)) {
        const moveResult = g.move({ from: selectedSquare, to: sq, promotion: "q" });
        if (moveResult) {
          setLastMove({ from: selectedSquare, to: sq });
          setSelectedSquare(null);
          setLegalMoveSquares([]);
          syncState();
          // Small delay so the player sees their move rendered before AI thinks
          setTimeout(() => triggerComputerMove(playerColor, difficulty), 150);
          return;
        }
      }

      // Select a new piece belonging to the player
      const piece = g.get(sq);
      if (piece && piece.color === playerColor) {
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
      isComputerThinking,
      syncState,
      triggerComputerMove,
    ],
  );

  // ── resetGame ─────────────────────────────────────────────────────────────
  const resetGame = useCallback(
    (color: PieceColor, diff: Difficulty) => {
      // Invalidate any in-flight worker message
      pendingMsgId.current = ++msgId;

      gameRef.current = new Chess();
      setPlayerColor(color);
      setDifficulty(diff);
      setSelectedSquare(null);
      setLegalMoveSquares([]);
      setLastMove(null);
      setIsComputerThinking(false);
      syncState();

      // If player chose black, computer (white) goes first
      if (color === "b") {
        setTimeout(() => triggerComputerMove(color, diff), 300);
      }
    },
    [syncState, triggerComputerMove],
  );

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
    isComputerThinking,
    selectSquare,
    resetGame,
  };
}
