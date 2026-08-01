import { useEffect, useRef } from "react";

import type { PieceColor, PieceType } from "@/types";

import { getPieceComponent } from "@/components/pieces/lookup";
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
      <span className="w-7 shrink-0 text-[11px] text-text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-px">
        {sorted.map((p, i) => {
          const Comp = getPieceComponent(color, p);
          return Comp ? <Comp key={i} size={22} /> : null;
        })}
        {pieces.length === 0 && (
          <span className="text-[11px] text-text-muted" style={{ opacity: 0.3 }}>
            none
          </span>
        )}
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
    <div className="flex w-[210px] min-w-[170px] flex-col gap-3">
      {/* Captured pieces */}
      <section className="rounded-lg border border-border bg-surface px-3.5 pt-3 pb-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium text-text-muted">Captured</span>
          {diff !== 0 && (
            <span
              className="font-mono text-[11px] font-semibold"
              style={{ color: "var(--color-accent)" }}
            >
              {diff > 0 ? `+${diff}` : diff}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <CapturedRow pieces={capturedPieces[playerColor]} color={computerColor} label="You" />
          <CapturedRow pieces={capturedPieces[computerColor]} color={playerColor} label="CPU" />
        </div>
      </section>

      {/* Move history */}
      <section className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface px-3.5 pt-3 pb-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-medium text-text-muted">Moves</span>
          {history.length > 0 && (
            <span className="font-mono text-[10px] text-text-muted" style={{ opacity: 0.5 }}>
              {Math.ceil(history.length / 2)}
            </span>
          )}
        </div>
        <div
          className="flex max-h-[380px] flex-col gap-px overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-border) transparent",
            overscrollBehavior: "contain",
          }}
        >
          {paired.length === 0 && (
            <span className="text-[12px] text-text-muted" style={{ opacity: 0.35 }}>
              No moves yet
            </span>
          )}
          {paired.map(([white, black], idx) => (
            <div
              key={idx}
              className="grid items-center rounded px-1 py-[3px]"
              style={{
                gridTemplateColumns: "24px 1fr 1fr",
                ...(idx === paired.length - 1 && { background: "var(--last-move-bg)" }),
              }}
            >
              <span
                className="text-right font-mono text-[10px] text-text-muted"
                style={{ opacity: 0.5 }}
              >
                {idx + 1}
              </span>
              <span
                className="px-1.5 font-mono text-[12px]"
                style={{ color: "var(--sq-light)", opacity: 0.85 }}
              >
                {white}
              </span>
              {black && (
                <span className="px-1.5 font-mono text-[12px]" style={{ color: "var(--sq-dark)" }}>
                  {black}
                </span>
              )}
            </div>
          ))}
          {isComputerThinking && (
            <div className="px-1 py-1.5" aria-live="polite" aria-atomic="true">
              <span className="animate-pulse-opacity font-mono text-[11px] text-text-muted italic">
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
