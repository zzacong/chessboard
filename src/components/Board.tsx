import type { Square } from "chess.js";

import { Chess } from "chess.js";

import type { LastMove, PieceColor } from "../types";

import { getPieceComponent } from "./pieces";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

interface BoardProps {
  fen: string;
  selectedSquare: Square | null;
  legalMoveSquares: Square[];
  lastMove: LastMove | null;
  playerColor: PieceColor;
  isComputerThinking: boolean;
  onSquareClick: (sq: Square) => void;
}

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

export function Board({
  fen,
  selectedSquare,
  legalMoveSquares,
  lastMove,
  playerColor,
  isComputerThinking,
  onSquareClick,
}: BoardProps) {
  const game = new Chess(fen);
  const flipped = playerColor === "b";
  const squares = buildSquares(flipped);

  // Build file/rank labels
  const fileLabels = flipped ? [...FILES].reverse() : [...FILES];
  const rankLabels = flipped
    ? ["1", "2", "3", "4", "5", "6", "7", "8"]
    : ["8", "7", "6", "5", "4", "3", "2", "1"];

  return (
    <div
      className={`flex items-start gap-1 select-none${isComputerThinking ? " cursor-wait" : ""}`}
    >
      {/* Rank labels left */}
      <div className="flex flex-col" style={{ height: "calc(var(--sq-size) * 8)" }}>
        {rankLabels.map((r) => (
          <span
            key={r}
            className="flex items-center justify-center w-5 text-[11px] font-bold tracking-wide"
            style={{ height: "var(--sq-size)", color: "var(--color-text-muted)" }}
          >
            {r}
          </span>
        ))}
      </div>

      <div className="flex flex-col">
        {/* Grid */}
        <div
          className="grid overflow-hidden rounded-[3px]"
          style={{
            gridTemplateColumns: "repeat(8, var(--sq-size))",
            gridTemplateRows: "repeat(8, var(--sq-size))",
            border: "3px solid #3a2510",
            boxShadow: "0 12px 48px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)",
          }}
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

            const squareClass = [
              "relative flex items-center justify-center cursor-pointer group",
              isLight ? "sq-light" : "sq-dark",
              isSelected ? "sq-selected" : "",
              isLastFrom || isLastTo ? "sq-last-move" : "",
              isKingInCheck ? "sq-in-check" : "",
              "hover:sq-hover",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={sq}
                className={squareClass}
                style={{ width: "var(--sq-size)", height: "var(--sq-size)" }}
                onClick={() => onSquareClick(sq)}
                role="button"
                aria-label={sq}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onSquareClick(sq)}
              >
                {/* hover overlay */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/[0.12] pointer-events-none z-[4]" />

                {isLegal && <div className={isCapture ? "legal-ring" : "legal-dot"} />}
                {PieceComp && (
                  <div
                    className="relative z-[2] flex items-center justify-center pointer-events-none transition-transform duration-[120ms] ease-out group-hover:scale-[1.08]"
                    style={{
                      width: "88%",
                      height: "88%",
                      ...(isSelected
                        ? {
                            transform: "scale(1.1)",
                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                          }
                        : {}),
                    }}
                  >
                    <PieceComp size={44} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* File labels bottom */}
        <div className="flex mt-1" style={{ width: "calc(var(--sq-size) * 8)" }}>
          {fileLabels.map((f) => (
            <span
              key={f}
              className="flex items-center justify-center text-[11px] font-bold tracking-[0.04em]"
              style={{ width: "var(--sq-size)", color: "var(--color-text-muted)" }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
