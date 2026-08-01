import type { Square } from "chess.js";
import type React from "react";

import { Chess } from "chess.js";
import { useCallback, useRef } from "react";

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
  border: "3px solid var(--board-border)",
  boxShadow: "0 12px 48px var(--shadow-board), 0 4px 12px var(--shadow-board-2)",
};
const PIECE_WRAPPER_BASE: React.CSSProperties = { width: "88%", height: "88%" };
const PIECE_WRAPPER_SELECTED: React.CSSProperties = {
  width: "88%",
  height: "88%",
  transform: "scale(1.1)",
  filter: "drop-shadow(0 4px 8px var(--shadow-piece))",
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

  // Roving tabIndex: track which square index currently owns tabIndex=0.
  // Starts at the square index that is selected, or 0 otherwise.
  const focusedIdxRef = useRef<number>(0);

  const game = new Chess(fen);
  const flipped = playerColor === "b";
  const squares = buildSquares(flipped);

  // Build file/rank labels
  const fileLabels = flipped ? [...FILES].reverse() : [...FILES];
  const rankLabels = flipped
    ? ["1", "2", "3", "4", "5", "6", "7", "8"]
    : ["8", "7", "6", "5", "4", "3", "2", "1"];

  // Refs to all 64 gridcell elements for programmatic focus
  const cellRefs = useRef<Array<HTMLDivElement | null>>(Array(64).fill(null));

  const moveFocus = useCallback((newIdx: number) => {
    const clamped = Math.max(0, Math.min(63, newIdx));
    focusedIdxRef.current = clamped;
    cellRefs.current[clamped]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, idx: number, sq: Square) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectSquare(sq);
        return;
      }
      // Arrow key navigation within the grid (row = idx/8, col = idx%8)
      const col = idx % 8;
      const row = Math.floor(idx / 8);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveFocus(col < 7 ? idx + 1 : idx - col); // wrap to start of row
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveFocus(col > 0 ? idx - 1 : idx + (7 - col)); // wrap to end of row
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocus(row < 7 ? idx + 8 : col); // wrap to top of column
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocus(row > 0 ? idx - 8 : 56 + col); // wrap to bottom of column
      }
    },
    [moveFocus, selectSquare],
  );

  // Build screen-reader announcement for legal moves
  const legalMovesAnnouncement =
    selectedSquare && legalMoveSquares.length > 0
      ? `${selectedSquare} selected. Legal moves: ${legalMoveSquares.join(", ")}.`
      : selectedSquare
        ? `${selectedSquare} selected. No legal moves.`
        : "";

  return (
    <div className="flex touch-manipulation items-start gap-1 select-none">
      {/* Screen-reader live region for legal move announcements (MED-1) */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {legalMovesAnnouncement}
      </span>

      {/* Rank labels left */}
      <div className="flex flex-col" style={{ height: "var(--board-size)" }}>
        {rankLabels.map((r) => (
          <span
            key={r}
            className="flex w-5 items-center justify-center text-xs font-bold tracking-wide text-text-muted"
            style={{ height: "var(--sq-size)" }}
          >
            {r}
          </span>
        ))}
      </div>

      <div className="flex flex-col">
        {/* Grid — role="grid" with role="gridcell" children (HIGH-1 fix) */}
        <div
          className="grid overflow-hidden rounded"
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
            // Enrich the label with selection and legal-move context
            const legalSuffix = isLegal ? (isCapture ? ", capture available" : ", legal move") : "";
            const selectedSuffix = isSelected ? ", selected" : "";
            const squareLabel = pieceLabel
              ? `${sq}: ${pieceLabel}${selectedSuffix}${legalSuffix}`
              : `${sq}${selectedSuffix}${legalSuffix}`;

            // Roving tabIndex: only the focused/selected square gets 0 (HIGH-2 fix)
            const isRovingFocused =
              i === focusedIdxRef.current ||
              (isSelected && focusedIdxRef.current === 0 && i === squares.indexOf(selectedSquare));
            const tabIdx = isRovingFocused ? 0 : -1;

            return (
              <div
                key={sq}
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                className={squareClass}
                style={{ width: "var(--sq-size)", height: "var(--sq-size)" }}
                onClick={() => {
                  focusedIdxRef.current = i;
                  selectSquare(sq);
                }}
                role="gridcell"
                aria-label={squareLabel}
                aria-selected={isSelected}
                tabIndex={tabIdx}
                onKeyDown={(e) => handleKeyDown(e, i, sq)}
                onFocus={() => {
                  focusedIdxRef.current = i;
                }}
              >
                {/* hover overlay */}
                <span
                  className="pointer-events-none absolute inset-0 z-4 opacity-0 group-hover:opacity-100"
                  style={{ background: "var(--hover-overlay)" }}
                />

                {isLegal && <div className={isCapture ? "legal-ring" : "legal-dot"} />}
                {PieceComp && (
                  <div
                    className="pointer-events-none relative z-2 flex items-center justify-center transition-transform duration-100 ease-out group-hover:scale-110"
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
        <div className="mt-1 flex" style={{ width: "var(--board-size)" }}>
          {fileLabels.map((f) => (
            <span
              key={f}
              className="flex items-center justify-center text-xs font-bold tracking-wide text-text-muted"
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
