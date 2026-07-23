import { useEffect, useRef } from "react";

import type { CapturedPieces, PieceColor, PieceType } from "../types";

import { getPieceComponent } from "./pieces";

interface SidebarProps {
  history: string[];
  capturedPieces: CapturedPieces;
  playerColor: PieceColor;
  isComputerThinking: boolean;
}

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

const sectionStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
};

const sectionTitleClass = "text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5";

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
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-[11px] w-7 shrink-0" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-px items-center">
        {sorted.map((p, i) => {
          const Comp = getPieceComponent(color, p);
          return Comp ? <Comp key={i} size={22} /> : null;
        })}
        {pieces.length === 0 && (
          <span className="text-xs opacity-50" style={{ color: "var(--color-text-muted)" }}>
            —
          </span>
        )}
      </div>
    </div>
  );
}

export function Sidebar({
  history,
  capturedPieces,
  playerColor,
  isComputerThinking,
}: SidebarProps) {
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
    <div className="flex flex-col gap-4 w-[220px] min-w-[180px]">
      {/* Captured pieces */}
      <section className="rounded-[10px] px-3.5 pt-3.5 pb-3" style={sectionStyle}>
        <h3 className={sectionTitleClass} style={{ color: "var(--color-text-muted)" }}>
          Captured
        </h3>
        <CapturedRow pieces={capturedPieces[playerColor]} color={computerColor} label="You" />
        <CapturedRow pieces={capturedPieces[computerColor]} color={playerColor} label="CPU" />
        {diff !== 0 && (
          <div
            className="text-xs font-semibold mt-1 text-right"
            style={{ color: "var(--color-accent-2)" }}
          >
            {diff > 0 ? `+${diff}` : diff} material
          </div>
        )}
      </section>

      {/* Move history */}
      <section
        className="flex-1 flex flex-col overflow-hidden rounded-[10px] px-3.5 pt-3.5 pb-3"
        style={sectionStyle}
      >
        <h3 className={sectionTitleClass} style={{ color: "var(--color-text-muted)" }}>
          Moves
        </h3>
        <div
          className="overflow-y-auto max-h-[380px] flex flex-col gap-0.5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "var(--color-border) transparent" }}
        >
          {paired.length === 0 && (
            <span className="text-xs opacity-50" style={{ color: "var(--color-text-muted)" }}>
              No moves yet
            </span>
          )}
          {paired.map(([white, black], idx) => (
            <div
              key={idx}
              className={`grid gap-0.5 items-center px-1 py-0.5 rounded text-[13px]${idx === paired.length - 1 ? " bg-white/5" : ""}`}
              style={{ gridTemplateColumns: "28px 1fr 1fr" }}
            >
              <span
                className="text-[11px] text-right pr-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {idx + 1}.
              </span>
              <span
                className="px-1.5 py-0.5 rounded-[3px] font-mono text-[13px]"
                style={{ color: "#f0d9b5" }}
              >
                {white}
              </span>
              {black && (
                <span
                  className="px-1.5 py-0.5 rounded-[3px] font-mono text-[13px]"
                  style={{ color: "#b58863" }}
                >
                  {black}
                </span>
              )}
            </div>
          ))}
          {isComputerThinking && (
            <div className="px-1 py-1">
              <span
                className="text-xs italic animate-pulse-opacity"
                style={{ color: "var(--color-text-muted)" }}
              >
                CPU thinking…
              </span>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>
      </section>
    </div>
  );
}
