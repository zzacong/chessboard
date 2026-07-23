import React from "react";
import type { PieceColor, PieceType } from "../../types";

// ── Individual piece SVG components ──────────────────────────────────────────
// Based on the Wikimedia Commons "Chess piece - 2D" SVG set (public domain)

interface PieceProps {
  size?: number;
}

// ── WHITE KING ────────────────────────────────────────────────────────────────
export function WKing({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
        <path
          d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
          fill="#fff"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
        <path
          d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-5-8-2.5c-3 2.5 0 10.5 0 10.5v2"
          fill="#fff"
        />
        <path d="M11.5 29.5s3.5-3 11-3 11 3 11 3" />
        <path d="M11.5 33.5s3.5-4.5 11-4.5 11 4.5 11 4.5" />
        <path d="M11.5 37s3.5-4 11-4 11 4 11 4" />
      </g>
    </svg>
  );
}

// ── WHITE QUEEN ───────────────────────────────────────────────────────────────
export function WQueen({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round">
        <circle cx="6" cy="12" r="2.75" />
        <circle cx="14" cy="9" r="2.75" />
        <circle cx="22.5" cy="8" r="2.75" />
        <circle cx="31" cy="9" r="2.75" />
        <circle cx="39" cy="12" r="2.75" />
        <path
          d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 25l-.3-14.1-8.2 13.4-8.2-13.5L14 25 6.5 13.5 9 26z"
          strokeLinecap="butt"
        />
        <path
          d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
          strokeLinecap="butt"
        />
        <path d="M11 38.5a35 35 1 0 0 23 0" fill="none" strokeLinecap="butt" />
        <path
          d="M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0M10.5 37.5a35 35 1 0 0 24 0"
          fill="none"
          stroke="#000"
        />
      </g>
    </svg>
  );
}

// ── WHITE ROOK ────────────────────────────────────────────────────────────────
export function WRook({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"
          strokeLinejoin="miter"
        />
        <path d="M34 14l-3 3H14l-3-3" />
        <path d="M31 17v12.5H14V17" strokeLinecap="butt" strokeLinejoin="miter" />
        <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
        <path d="M11 14h23" fill="none" stroke="#000" strokeLinejoin="miter" />
      </g>
    </svg>
  );
}

// ── WHITE BISHOP ──────────────────────────────────────────────────────────────
export function WBishop({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <g fill="#fff" strokeLinecap="butt">
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
        </g>
        <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke="#000" />
      </g>
    </svg>
  );
}

// ── WHITE KNIGHT ──────────────────────────────────────────────────────────────
export function WKnight({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff" />
        <path d="M24 18c.38 5.12-4.5 8.63-5 14" fill="none" stroke="#000" />
        <path d="M24.5 15.5h-1" stroke="#000" strokeWidth="2" />
        <path d="M15 11.5c0 4.5 5 7 9 9.5-3 1.5-4.5 2.5-6.5 7" fill="#fff" />
        <path
          d="M14.5 10.5c-3.5 4.5-5 7.5-4.5 12 .3 3 3 6 5.5 6.5-3 .5-6.5-1-7.5-2.5-2-4.5-1-12.5 6.5-16z"
          fill="#fff"
        />
        <path d="M20 9c-5.67.33-13.5 5.5-14 14" fill="none" stroke="#000" />
        <circle cx="14" cy="11.5" r="1.5" fill="#000" />
        <path d="M22.5 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#000" stroke="none" />
      </g>
    </svg>
  );
}

// ── WHITE PAWN ────────────────────────────────────────────────────────────────
export function WPawn({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#fff"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── BLACK KING ────────────────────────────────────────────────────────────────
export function BKing({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g
        fill="none"
        fillRule="evenodd"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22.5 11.63V6" strokeLinejoin="miter" />
        <path
          d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
          fill="#000"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
        <path
          d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-5-8-2.5c-3 2.5 0 10.5 0 10.5v2"
          fill="#000"
        />
        <path d="M20 8h5" strokeLinejoin="miter" />
        <path
          d="M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5l.01 2.1-.01-2.1C20 18 10.85 14 6.97 19.85 4.5 25.5 13 29.5 13 29.5"
          fill="#000"
          stroke="#000"
        />
        <path
          d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"
          stroke="#fff"
        />
      </g>
    </svg>
  );
}

// ── BLACK QUEEN ───────────────────────────────────────────────────────────────
export function BQueen({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g fill="#000" stroke="#000" strokeWidth="1.5" strokeLinejoin="round">
        <circle cx="6" cy="12" r="2.75" />
        <circle cx="14" cy="9" r="2.75" />
        <circle cx="22.5" cy="8" r="2.75" />
        <circle cx="31" cy="9" r="2.75" />
        <circle cx="39" cy="12" r="2.75" />
        <path
          d="M9 26c8.5-8.5 15.5-8.5 27 0l2.5-12.5L31 25l-.3-14.1-8.2 13.4-8.2-13.5L14 25 6.5 13.5 9 26z"
          strokeLinecap="butt"
        />
        <path
          d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
          strokeLinecap="butt"
        />
        <path d="M11 38.5a35 35 1 0 0 23 0" fill="none" stroke="#fff" strokeLinecap="butt" />
        <path
          d="M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0M10.5 37.5a35 35 1 0 0 24 0"
          fill="none"
          stroke="#fff"
        />
      </g>
    </svg>
  );
}

// ── BLACK ROOK ────────────────────────────────────────────────────────────────
export function BRook({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g fill="#000" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z"
          strokeLinejoin="miter"
        />
        <path d="M14 29.5v-13h17v13H14z" strokeLinecap="butt" strokeLinejoin="miter" />
        <path
          d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z"
          strokeLinejoin="miter"
        />
        <path
          d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  );
}

// ── BLACK BISHOP ──────────────────────────────────────────────────────────────
export function BBishop({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <g fill="#000" strokeLinecap="butt">
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
        </g>
        <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke="#fff" />
      </g>
    </svg>
  );
}

// ── BLACK KNIGHT ──────────────────────────────────────────────────────────────
export function BKnight({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#000" />
        <path d="M24 18c.38 5.12-4.5 8.63-5 14" fill="none" stroke="#fff" />
        <path d="M24.5 15.5h-1" stroke="#fff" strokeWidth="2" />
        <path d="M15 11.5c0 4.5 5 7 9 9.5-3 1.5-4.5 2.5-6.5 7" fill="#000" />
        <path
          d="M14.5 10.5c-3.5 4.5-5 7.5-4.5 12 .3 3 3 6 5.5 6.5-3 .5-6.5-1-7.5-2.5-2-4.5-1-12.5 6.5-16z"
          fill="#000"
        />
        <path d="M20 9c-5.67.33-13.5 5.5-14 14" fill="none" stroke="#fff" />
        <circle cx="14" cy="11.5" r="1.5" fill="#fff" />
        <path d="M22.5 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#fff" stroke="none" />
      </g>
    </svg>
  );
}

// ── BLACK PAWN ────────────────────────────────────────────────────────────────
export function BPawn({ size = 45 }: PieceProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 45 45">
      <path
        d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
        fill="#000"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Lookup map ────────────────────────────────────────────────────────────────
type PieceComponent = (props: PieceProps) => React.JSX.Element;

export const PIECE_COMPONENTS: Record<string, PieceComponent> = {
  wk: WKing,
  wq: WQueen,
  wr: WRook,
  wb: WBishop,
  wn: WKnight,
  wp: WPawn,
  bk: BKing,
  bq: BQueen,
  br: BRook,
  bb: BBishop,
  bn: BKnight,
  bp: BPawn,
};

export function getPieceComponent(color: PieceColor, type: PieceType): PieceComponent | null {
  return PIECE_COMPONENTS[`${color}${type}`] ?? null;
}
