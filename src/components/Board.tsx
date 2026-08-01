import type { Square } from "chess.js";
import type React from "react";

import { Chess } from "chess.js";

import { getPieceComponent } from "@/components/pieces/lookup";
import { cn } from "@/lib/cn";
import { useChessStore } from "@/store/chessStore";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

const PIECE_NAMES: Record<string, string> = {
  k: "King",
  q: "Queen",
  r: "Rook",
  b: "Bishop",
  n: "Knight",
  p: "Pawn",
};

// Static style objects hoisted to module level so they are not recreated on every render.
const GRID_STYLE: React.CSSProperties = {
  gridTemplateColumns: "repeat(8, var(--sq-size))",
  gridTemplateRows: "repeat(8, var(--sq-size))",
  border: "3px solid #3a2510",
  boxShadow: "0 12px 48px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)",
};
const PIECE_WRAPPER_BASE: React.CSSProperties = { width: "88%", height: "88%" };
const PIECE_WRAPPER_SELECTED: React.CSSProperties = {
  width: "88%",
  height: "88%",
  transform: "scale(1.1)",
  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
};

// Build ordered square names for the board (rank 8→1 for white, rank 1→8 for black)
function buildSquares(flipped: boolean): Square[] {
  const squares: Square[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const fileIdx = flipped ? 7 - col : col;
      const rankIdx = flipped ? row : 7 - row;
      squares.push(`${FILES[fileIdx]}${rankIdx + 1}` as Square);
    }
  }
  return squares;
}

export function Board() {
  const fen = useChessStore((s) => s.fen);
  const selectedSquare = useChessStore((s) => s.selectedSquare);
  const legalMoveSquares = useChessStore((s) => s.legalMoveSquares);
  const lastMove = useChessStore((s) => s.lastMove);
  const playerColor = useChessStore((s) => s.playerColor);
  const selectSquare = useChessStore((s) => s.selectSquare);

  const game = new Chess(fen);
  const flipped = playerColor === "b";
  const squares = buildSquares(flipped);

  // Build file/rank labels
  const fileLabels = flipped ? [...FILES].reverse() : [...FILES];
  const rankLabels = flipped
    ? ["1", "2", "3", "4", "5", "6", "7", "8"]
    : ["8", "7", "6", "5", "4", "3", "2", "1"];

  return (
    <div className="flex items-start gap-1 select-none" style={{ touchAction: "manipulation" }}>
      {/* Rank labels left */}
      <div className="flex flex-col" style={{ height: "calc(var(--sq-size) * 8)" }}>
        {rankLabels.map((r) => (
          <span
            key={r}
            className="flex w-5 items-center justify-center text-[11px] font-bold tracking-wide text-text-muted"
            style={{ height: "var(--sq-size)" }}
          >
            {r}
          </span>
        ))}
      </div>

      <div className="flex flex-col">
        {/* Grid */}
        <div
          className="grid overflow-hidden rounded-[3px]"
          style={GRID_STYLE}
          role="grid"
          aria-label="Chess board"
        >
          {squares.map((sq, i) => {
            const fileIdx = i % 8;
            const rankIdx = Math.floor(i / 8);
            const isLight = (fileIdx + rankIdx) % 2 === 0;
            const piece = game.get(sq);
            const isSelected = sq === selectedSquare;
            const isLegal = legalMoveSquares.includes(sq);
            const isCapture = isLegal && !!piece;
            const isLastFrom = lastMove?.from === sq;
            const isLastTo = lastMove?.to === sq;
            const isKingInCheck =
              piece && piece.type === "k" && piece.color === game.turn() && game.isCheck();

            const PieceComp = piece ? getPieceComponent(piece.color, piece.type) : null;

            const squareClass = cn(
              "group relative flex cursor-pointer items-center justify-center",
              isLight ? "sq-light" : "sq-dark",
              isSelected && "sq-selected",
              (isLastFrom || isLastTo) && "sq-last-move",
              isKingInCheck && "sq-in-check",
            );

            const pieceLabel = piece
              ? `${piece.color === "w" ? "White" : "Black"} ${PIECE_NAMES[piece.type] ?? piece.type}`
              : null;
            const squareLabel = pieceLabel ? `${sq}: ${pieceLabel}` : sq;

            return (
              <div
                key={sq}
                className={squareClass}
                style={{ width: "var(--sq-size)", height: "var(--sq-size)" }}
                onClick={() => selectSquare(sq)}
                role="button"
                aria-label={squareLabel}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && selectSquare(sq)}
              >
                {/* hover overlay */}
                <span className="pointer-events-none absolute inset-0 z-[4] bg-white/[0.12] opacity-0 group-hover:opacity-100" />

                {isLegal && <div className={isCapture ? "legal-ring" : "legal-dot"} />}
                {PieceComp && (
                  <div
                    className="pointer-events-none relative z-[2] flex items-center justify-center transition-transform duration-[120ms] ease-out group-hover:scale-[1.08]"
                    style={isSelected ? PIECE_WRAPPER_SELECTED : PIECE_WRAPPER_BASE}
                  >
                    <PieceComp size={44} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* File labels bottom */}
        <div className="mt-1 flex" style={{ width: "calc(var(--sq-size) * 8)" }}>
          {fileLabels.map((f) => (
            <span
              key={f}
              className="flex items-center justify-center text-[11px] font-bold tracking-[0.04em] text-text-muted"
              style={{ width: "var(--sq-size)" }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
