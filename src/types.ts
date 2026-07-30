// Shared types used across the chess app
import type { Square } from "chess.js";

export type PieceColor = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "vs-computer" | "multiplayer" | "computer-vs-computer";
export type GameStatus = "idle" | "playing" | "check" | "checkmate" | "stalemate" | "draw";
export type EngineVersion = "v1" | "v2";

export const DEPTH_MAP: Record<Difficulty, number> = {
  easy: 1,
  medium: 3,
  hard: 5,
};

export const SKILL_MAP: Record<Difficulty, number> = {
  easy: 3,
  medium: 10,
  hard: 20,
};

export interface CapturedPieces {
  w: PieceType[]; // pieces captured BY white (i.e., black pieces taken)
  b: PieceType[]; // pieces captured BY black (i.e., white pieces taken)
}

export interface LastMove {
  from: Square;
  to: Square;
}
