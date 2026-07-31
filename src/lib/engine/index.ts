// Public API for the engine layer.
// Import from "@/lib/engine" to get getEngine, Engine, and EngineOptions.

import type { EngineVersion } from "@/types";

import { getMinimax } from "./v1/minimaxEngine";
import { getStockfish } from "./v2/stockfish";

export type EngineOptions = {
  depth: number; // used by MinimaxEngine
  skillLevel: number; // used by StockfishEngine (0–20)
};

export interface Engine {
  getBestMove(fen: string, opts: EngineOptions): Promise<string | null>;
  cancelSearch(): void;
  terminate(): void;
  newGame?(): void;
}

export function getEngine(version: EngineVersion): Engine {
  return version === "v2" ? getStockfish() : getMinimax();
}
