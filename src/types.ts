// Shared types used across the chess app
import type { Square } from "chess.js";

export type PieceColor = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "vs-computer" | "multiplayer" | "computer-vs-computer";
export type GameStatus = "playing" | "check" | "checkmate" | "stalemate" | "draw";
export type EngineVersion = "v1" | "v2";

export const DEPTH_MAP: Record<Difficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 5,
};

// Stockfish v2: UCI_LimitStrength + UCI_Elo targets
export const ELO_MAP: Record<Difficulty, number> = {
  easy: 1320,
  medium: 1800,
  hard: 2800,
};

// Stockfish v2: milliseconds per move (go movetime)
export const MOVETIME_MAP: Record<Difficulty, number> = {
  easy: 200,
  medium: 500,
  hard: 1500,
};

export interface CapturedPieces {
  w: PieceType[]; // pieces captured BY white (i.e., black pieces taken)
  b: PieceType[]; // pieces captured BY black (i.e., white pieces taken)
}

export interface LastMove {
  from: Square;
  to: Square;
}
