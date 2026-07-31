// Public API for the engine layer.
// Import from "@/lib/engine" to get getEngine, Engine, and EngineOptions.

import type { EngineVersion } from "@/types";

import { getMinimax } from "./v1/minimaxEngine";
import { getStockfish } from "./v2/stockfish";

export type EngineOptions = {
  depth: number; // used by MinimaxEngine (v1)
  elo: number; // used by StockfishEngine (v2) — UCI_Elo target
  movetime: number; // used by StockfishEngine (v2) — ms per move
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
