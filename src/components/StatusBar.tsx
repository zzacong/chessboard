import type { Difficulty, GameMode, GameStatus, PieceColor } from "../types";

import { cn } from "../lib/cn";

interface StatusBarProps {
  status: GameStatus;
  turn: PieceColor;
  playerColor: PieceColor;
  difficulty: Difficulty;
  gameMode: GameMode;
  isComputerThinking: boolean;
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
): { text: string; type: MsgType } {
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
  normal: "#4ade80",
  warning: "var(--color-accent-2)",
  danger: "var(--color-accent)",
  success: "#4ade80",
};

const messageColor: Record<MsgType, string> = {
  normal: "var(--color-text)",
  warning: "var(--color-accent-2)",
  danger: "var(--color-accent)",
  success: "#4ade80",
};

export function StatusBar({
  status,
  turn,
  playerColor,
  difficulty,
  gameMode,
  isComputerThinking,
  onNewGame,
}: StatusBarProps) {
  const msg = statusMessage(status, turn, playerColor, gameMode, isComputerThinking);
  const isOver = status === "checkmate" || status === "stalemate" || status === "draw";
  const blink = msg.type === "danger" || msg.type === "success";

  return (
    <div
      className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-2.5"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
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
        <span className="text-xs whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
          {gameMode === "multiplayer"
            ? "👥 Local 2P"
            : `${playerColor === "w" ? "♔ White" : "♚ Black"} · ${DIFFICULTY_LABELS[difficulty]}`}
        </span>
        <button
          className={cn(
            "rounded-lg px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-[border-color,background,box-shadow] duration-150 hover:bg-white/5",
            isOver && "animate-pulse-border",
          )}
          style={
            isOver
              ? {
                  background: "transparent",
                  border: "1.5px solid var(--color-accent)",
                  color: "var(--color-accent)",
                }
              : {
                  background: "transparent",
                  border: "1.5px solid var(--color-border)",
                  color: "var(--color-text)",
                }
          }
          onClick={onNewGame}
        >
          New Game
        </button>
      </div>
    </div>
  );
}
