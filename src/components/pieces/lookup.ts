import type React from "react";

import type { PieceColor, PieceType } from "../../types";

import {
  BBishop,
  BKing,
  BKnight,
  BPawn,
  BQueen,
  BRook,
  WBishop,
  WKing,
  WKnight,
  WPawn,
  WQueen,
  WRook,
} from "./index";

interface PieceProps {
  size?: number;
}
type PieceComponent = (props: PieceProps) => React.JSX.Element;

const PIECE_COMPONENTS: Record<string, PieceComponent> = {
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
