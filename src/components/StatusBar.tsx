import type { Difficulty, GameMode, GameStatus, PieceColor } from "../types";

import { cn } from "../lib/cn";
import { useChessStore } from "../store/chessStore";

interface StatusBarProps {
  onNewGame: () => void;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

type MsgType = "normal" | "warning" | "danger" | "success";

function statusMessage(
  status: GameStatus,
  turn: PieceColor,
  playerColor: PieceColor,
  gameMode: GameMode,
  isComputerThinking: boolean,
  isPaused: boolean,
): { text: string; type: MsgType } {
  if (gameMode === "computer-vs-computer") {
    const turnName = turn === "w" ? "White" : "Black";
    if (status === "checkmate") {
      const winner = turn === "w" ? "Black" : "White";
      return { text: `Checkmate — ${winner} wins! 🎉`, type: "success" };
    }
    if (status === "stalemate") return { text: "Stalemate — Draw", type: "warning" };
    if (status === "draw") return { text: "Draw", type: "warning" };
    if (status === "check") {
      return { text: `Check — ${turnName}'s king in danger!`, type: "danger" };
    }
    if (isPaused) return { text: "Paused", type: "warning" };
    return { text: `${turnName} is thinking…`, type: "normal" };
  }

  if (gameMode === "multiplayer") {
    const turnName = turn === "w" ? "White" : "Black";
    if (status === "checkmate") {
      const winner = turn === "w" ? "Black" : "White";
      return { text: `${winner} wins! 🎉`, type: "success" };
    }
    if (status === "stalemate") return { text: "Stalemate — Draw", type: "warning" };
    if (status === "draw") return { text: "Draw", type: "warning" };
    if (status === "check") {
      return { text: `Check — ${turnName}'s king in danger!`, type: "danger" };
    }
    return { text: `${turnName}'s turn`, type: "normal" };
  }

  // vs-computer messages
  if (status === "checkmate") {
    const winner = turn === "w" ? "b" : "w";
    return winner === playerColor
      ? { text: "Checkmate — You win! 🎉", type: "success" }
      : { text: "Checkmate — Computer wins", type: "danger" };
  }
  if (status === "stalemate") return { text: "Stalemate — Draw", type: "warning" };
  if (status === "draw") return { text: "Draw", type: "warning" };
  if (status === "check") {
    return turn === playerColor
      ? { text: "Check — Your king is in danger!", type: "danger" }
      : { text: "Check!", type: "warning" };
  }
  if (isComputerThinking) return { text: "Computer is thinking…", type: "normal" };
  return turn === playerColor
    ? { text: "Your turn", type: "normal" }
    : { text: "Computer's turn", type: "normal" };
}

const indicatorColor: Record<MsgType, string> = {
  normal: "var(--color-success)",
  warning: "var(--color-accent-2)",
  danger: "var(--color-accent)",
  success: "var(--color-success)",
};

const messageColor: Record<MsgType, string> = {
  normal: "var(--color-text)",
  warning: "var(--color-accent-2)",
  danger: "var(--color-accent)",
  success: "var(--color-success)",
};

export function StatusBar({ onNewGame }: StatusBarProps) {
  const status = useChessStore((s) => s.status);
  const turn = useChessStore((s) => s.turn);
  const playerColor = useChessStore((s) => s.playerColor);
  const difficulty = useChessStore((s) => s.difficulty);
  const difficultyBlack = useChessStore((s) => s.difficultyBlack);
  const gameMode = useChessStore((s) => s.gameMode);
  const isComputerThinking = useChessStore((s) => s.isComputerThinking);
  const isPaused = useChessStore((s) => s.isPaused);
  const togglePause = useChessStore((s) => s.togglePause);
  const undoMove = useChessStore((s) => s.undoMove);
  const history = useChessStore((s) => s.history);

  const msg = statusMessage(status, turn, playerColor, gameMode, isComputerThinking, isPaused);
  const isOver = status === "checkmate" || status === "stalemate" || status === "draw";
  const canUndo =
    gameMode !== "computer-vs-computer" && !isOver && !isComputerThinking && history.length > 0;
  const blink = msg.type === "danger" || msg.type === "success";

  let modeChip: string;
  if (gameMode === "multiplayer") {
    modeChip = "👥 Local 2P";
  } else if (gameMode === "computer-vs-computer") {
    modeChip = `🤖 CPU vs CPU · ${DIFFICULTY_LABELS[difficulty]} vs ${DIFFICULTY_LABELS[difficultyBlack]}`;
  } else {
    modeChip = `${playerColor === "w" ? "♔ White" : "♚ Black"} · ${DIFFICULTY_LABELS[difficulty]}`;
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn("h-2 w-2 shrink-0 rounded-full", blink && "animate-blink")}
          style={{ background: indicatorColor[msg.type] }}
        />
        <span
          className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap"
          style={{ color: messageColor[msg.type] }}
        >
          {msg.text}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs whitespace-nowrap text-text-muted">{modeChip}</span>
        {canUndo && (
          <button
            className="rounded-lg border border-border bg-transparent px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-text transition-[border-color,background,box-shadow] duration-150 hover:bg-white/5"
            onClick={undoMove}
          >
            Undo
          </button>
        )}
        {gameMode === "computer-vs-computer" && !isOver && (
          <button
            className="rounded-lg border border-border bg-transparent px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap text-text transition-[border-color,background,box-shadow] duration-150 hover:bg-white/5"
            onClick={togglePause}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        )}
        <button
          className={cn(
            "rounded-lg bg-transparent px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-[border-color,background,box-shadow] duration-150 hover:bg-white/5",
            isOver
              ? "animate-pulse-border border border-accent text-accent"
              : "border border-border text-text",
          )}
          onClick={onNewGame}
        >
          New Game
        </button>
      </div>
    </div>
  );
}
