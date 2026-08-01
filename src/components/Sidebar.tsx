import { useEffect, useRef } from "react";

import type { PieceColor, PieceType } from "@/types";

import { getPieceComponent } from "@/components/pieces/lookup";
import { cn } from "@/lib/cn";
import { useChessStore } from "@/store/chessStore";

const PIECE_VALUES_DISPLAY: Record<PieceType, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
  k: 0,
};

function materialScore(pieces: PieceType[]): number {
  return pieces.reduce((sum, p) => sum + (PIECE_VALUES_DISPLAY[p] ?? 0), 0);
}

function sortedCaptured(pieces: PieceType[]): PieceType[] {
  return [...pieces].sort(
    (a, b) => (PIECE_VALUES_DISPLAY[b] ?? 0) - (PIECE_VALUES_DISPLAY[a] ?? 0),
  );
}

function CapturedRow({
  pieces,
  color,
  label,
}: {
  pieces: PieceType[];
  color: PieceColor;
  label: string;
}) {
  const sorted = sortedCaptured(pieces);
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 shrink-0 text-xs text-text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-px">
        {sorted.map((p, i) => {
          const Comp = getPieceComponent(color, p);
          return Comp ? <Comp key={i} size={22} /> : null;
        })}
        {pieces.length === 0 && <span className="text-xs text-text-muted opacity-30">none</span>}
      </div>
    </div>
  );
}

export function Sidebar() {
  const history = useChessStore((s) => s.history);
  const capturedPieces = useChessStore((s) => s.capturedPieces);
  const playerColor = useChessStore((s) => s.playerColor);
  const isComputerThinking = useChessStore((s) => s.isComputerThinking);

  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest move
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Pair moves into [white, black?] groups
  const paired: Array<[string, string?]> = [];
  for (let i = 0; i < history.length; i += 2) {
    paired.push([history[i], history[i + 1]]);
  }

  const computerColor: PieceColor = playerColor === "w" ? "b" : "w";

  // Material diff
  const playerScore = materialScore(capturedPieces[playerColor]);
  const computerScore = materialScore(capturedPieces[computerColor]);
  const diff = playerScore - computerScore;

  return (
    <div className="flex w-52.5 min-w-42.5 flex-col gap-3">
      {/* Captured pieces — MED-2: aria-label makes this a proper landmark */}
      <section
        aria-label="Captured pieces"
        className="rounded-lg border border-border bg-surface px-4 pt-3 pb-3"
      >
        <div className="mb-2 flex items-center justify-between" aria-hidden="true">
          <span className="text-xs font-medium text-text-muted">Captured</span>
          {diff !== 0 && (
            <span className="font-mono text-xs font-semibold text-accent">
              {diff > 0 ? `+${diff}` : diff}
            </span>
          )}
        </div>
        {/* Visually hidden material summary for screen readers */}
        <span className="sr-only">
          {`You captured ${capturedPieces[playerColor].length} piece${capturedPieces[playerColor].length !== 1 ? "s" : ""}. `}
          {`CPU captured ${capturedPieces[computerColor].length} piece${capturedPieces[computerColor].length !== 1 ? "s" : ""}. `}
          {diff > 0 ? `You are ahead by ${diff} point${diff !== 1 ? "s" : ""}.` : diff < 0 ? `CPU is ahead by ${Math.abs(diff)} point${Math.abs(diff) !== 1 ? "s" : ""}.` : "Material is even."}
        </span>
        <div className="flex flex-col gap-2" aria-hidden="true">
          <CapturedRow pieces={capturedPieces[playerColor]} color={computerColor} label="You" />
          <CapturedRow pieces={capturedPieces[computerColor]} color={playerColor} label="CPU" />
        </div>
      </section>

      {/* Move history — MED-5: aria-label makes this a proper landmark */}
      <section
        aria-label="Move history"
        className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface px-4 pt-3 pb-3"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-text-muted">Moves</span>
          {history.length > 0 && (
            <span className="font-mono text-xs text-text-muted opacity-50">
              {Math.ceil(history.length / 2)}
            </span>
          )}
        </div>
        <div className="flex max-h-95 scrollbar-thin [scrollbar-color:var(--color-border)_transparent] flex-col gap-px overflow-y-auto overscroll-contain">
          {paired.length === 0 && (
            <span className="text-xs text-text-muted opacity-35">No moves yet</span>
          )}
          {/* INFO-2: Column headers for move list */}
          {paired.length > 0 && (
            <div
              className="grid items-center px-1 pb-1"
              style={{ gridTemplateColumns: "24px 1fr 1fr" }}
              aria-hidden="true"
            >
              <span />
              <span className="px-2 text-xs font-semibold text-text-muted opacity-50">White</span>
              <span className="px-2 text-xs font-semibold text-text-muted opacity-50">Black</span>
            </div>
          )}
          {paired.map(([white, black], idx) => (
            <div
              key={idx}
              className={cn(
                "grid items-center rounded px-1 py-1",
                idx === paired.length - 1 && "bg-(--last-move-bg)",
              )}
              style={{ gridTemplateColumns: "24px 1fr 1fr" }}
            >
              <span className="text-right font-mono text-xs text-text-muted opacity-50">
                {idx + 1}
              </span>
              <span className="px-2 font-mono text-xs text-text opacity-85">{white}</span>
              {black && <span className="px-2 font-mono text-xs text-text-muted">{black}</span>}
            </div>
          ))}
          {isComputerThinking && (
            <div className="px-1 py-2" aria-live="polite" aria-atomic="true">
              <span className="animate-pulse-opacity font-mono text-xs text-text-muted italic">
                thinking…
              </span>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>
      </section>
    </div>
  );
}
