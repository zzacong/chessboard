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

const sectionTitleClass = cn(
  "mb-2.5 text-[11px] font-bold tracking-[0.08em] text-text-muted uppercase",
);

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
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="w-7 shrink-0 text-[11px] text-text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-px">
        {sorted.map((p, i) => {
          const Comp = getPieceComponent(color, p);
          return Comp ? <Comp key={i} size={22} /> : null;
        })}
        {pieces.length === 0 && <span className="text-xs text-text-muted opacity-50">—</span>}
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
      <section className="rounded-lg border border-border bg-surface px-3.5 pt-3.5 pb-3">
        <h3 className={sectionTitleClass}>Captured</h3>
        <CapturedRow pieces={capturedPieces[playerColor]} color={computerColor} label="You" />
        <CapturedRow pieces={capturedPieces[computerColor]} color={playerColor} label="CPU" />
        {diff !== 0 && (
          <div
            className="mt-1.5 text-right text-[11px] font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            {diff > 0 ? `+${diff}` : diff}
          </div>
        )}
      </section>

      {/* Move history */}
      <section className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface px-3.5 pt-3.5 pb-3">
        <h3 className={sectionTitleClass}>Moves</h3>
        <div
          className="flex max-h-[380px] flex-col gap-px overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-border) transparent",
          }}
        >
          {paired.length === 0 && (
            <span className="text-[12px] text-text-muted opacity-40">No moves yet</span>
          )}
          {paired.map(([white, black], idx) => (
            <div
              key={idx}
              className={cn(
                "grid items-center rounded px-1 py-[3px]",
                idx === paired.length - 1 && "bg-white/[0.04]",
              )}
              style={{ gridTemplateColumns: "24px 1fr 1fr" }}
            >
              <span className="text-right text-[10px] text-text-muted">{idx + 1}</span>
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
            <div className="px-1 py-1.5">
              <span className="animate-pulse-opacity text-[11px] text-text-muted italic">
                Thinking…
              </span>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>
      </section>
    </div>
  );
}
