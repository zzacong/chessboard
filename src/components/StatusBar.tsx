import type { Difficulty, GameMode, GameStatus, PieceColor } from "@/types";

import { cn } from "@/lib/cn";
import { useChessStore } from "@/store/chessStore";

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
      return { text: `Checkmate - ${winner} wins!`, type: "success" };
    }
    if (status === "stalemate") return { text: "Stalemate - Draw", type: "warning" };
    if (status === "draw") return { text: "Draw", type: "warning" };
    if (status === "check") {
      return { text: `Check - ${turnName}'s king is in danger`, type: "danger" };
    }
    if (isPaused) return { text: "Paused", type: "warning" };
    return { text: `${turnName} is thinking…`, type: "normal" };
  }

  if (gameMode === "multiplayer") {
    const turnName = turn === "w" ? "White" : "Black";
    if (status === "checkmate") {
      const winner = turn === "w" ? "Black" : "White";
      return { text: `${winner} wins!`, type: "success" };
    }
    if (status === "stalemate") return { text: "Stalemate - Draw", type: "warning" };
    if (status === "draw") return { text: "Draw", type: "warning" };
    if (status === "check") {
      return { text: `Check - ${turnName}'s king is in danger`, type: "danger" };
    }
    return { text: `${turnName}'s turn`, type: "normal" };
  }

  // vs-computer messages
  if (status === "checkmate") {
    const winner = turn === "w" ? "b" : "w";
    return winner === playerColor
      ? { text: "Checkmate - You win!", type: "success" }
      : { text: "Checkmate - Computer wins", type: "danger" };
  }
  if (status === "stalemate") return { text: "Stalemate - Draw", type: "warning" };
  if (status === "draw") return { text: "Draw", type: "warning" };
  if (status === "check") {
    return turn === playerColor
      ? { text: "Check - Your king is in danger", type: "danger" }
      : { text: "Check!", type: "warning" };
  }
  if (isComputerThinking) return { text: "Computer is thinking…", type: "normal" };
  return turn === playerColor
    ? { text: "Your turn", type: "normal" }
    : { text: "Computer's turn", type: "normal" };
}

const indicatorClass: Record<MsgType, string> = {
  normal: "bg-success",
  warning: "bg-accent-2",
  danger: "bg-danger",
  success: "bg-success",
};

const messageClass: Record<MsgType, string> = {
  normal: "text-text",
  warning: "text-accent-2",
  danger: "text-danger",
  success: "text-success",
};

export function StatusBar() {
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
    modeChip = "Local 2P";
  } else if (gameMode === "computer-vs-computer") {
    modeChip = `CPU vs CPU · ${DIFFICULTY_LABELS[difficulty]} / ${DIFFICULTY_LABELS[difficultyBlack]}`;
  } else {
    modeChip = `${playerColor === "w" ? "White" : "Black"} · ${DIFFICULTY_LABELS[difficulty]}`;
  }

  const btnBase =
    "rounded border border-border bg-transparent px-3 py-1.5 text-[11px] font-medium whitespace-nowrap text-text-muted transition-[border-color,color,transform] duration-100 hover:border-border-2 hover:text-text active:scale-[0.97]";

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            indicatorClass[msg.type],
            blink && "animate-blink",
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "overflow-hidden text-[13px] font-medium text-ellipsis whitespace-nowrap",
            messageClass[msg.type],
          )}
          aria-live={msg.type === "danger" || msg.type === "success" ? "assertive" : "polite"}
          aria-atomic="true"
        >
          {msg.text}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-[10px] whitespace-nowrap text-text-muted opacity-60 sm:block">
          {modeChip}
        </span>
        <span className="hidden h-3 w-px bg-border sm:block" aria-hidden="true" />
        {canUndo && (
          <button className={btnBase} onClick={undoMove} aria-label="Undo last move">
            Undo
          </button>
        )}
        {gameMode === "computer-vs-computer" && !isOver && (
          <button className={btnBase} onClick={togglePause} aria-pressed={isPaused}>
            {isPaused ? "Resume" : "Pause"}
          </button>
        )}
      </div>
    </div>
  );
}
