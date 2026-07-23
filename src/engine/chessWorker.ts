import { getBestMove } from "./minimax";

self.onmessage = (e: MessageEvent<{ fen: string; depth: number; id: number }>) => {
  const { fen, depth, id } = e.data;
  const bestMove = getBestMove(fen, depth);
  self.postMessage({ bestMove, id });
};
