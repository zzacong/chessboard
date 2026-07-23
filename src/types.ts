// Shared types used across the chess app
import type { Square } from 'chess.js'

export type PieceColor = 'w' | 'b'
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameStatus = 'idle' | 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'

export const DEPTH_MAP: Record<Difficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 5,
}

export interface CapturedPieces {
  w: PieceType[] // pieces captured BY white (i.e., black pieces taken)
  b: PieceType[] // pieces captured BY black (i.e., white pieces taken)
}

export interface LastMove {
  from: Square
  to: Square
}
