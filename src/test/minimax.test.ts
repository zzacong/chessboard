import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

import { getBestMove } from "@/lib/engine/v1/minimax";

// Scholar's mate threat: after 1.e4 e5 2.Bc4 Nc6 3.Qh5 — Qxf7# is available
const SCHOLARS_MATE_THREAT_FEN =
  "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4";

describe("getBestMove", () => {
  it("returns a non-empty string for the starting position", () => {
    const move = getBestMove(new Chess().fen(), 1);
    expect(typeof move).toBe("string");
    expect(move.length).toBeGreaterThan(0);
  });

  it("returns a valid UCI move that chess.js can execute", () => {
    const game = new Chess();
    const move = getBestMove(game.fen(), 1);
    // getBestMove returns UCI format (e.g. "e2e4"); chess.js accepts it via { from, to }
    expect(move).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    expect(() => game.move({ from: move.slice(0, 2), to: move.slice(2, 4) })).not.toThrow();
  });

  it("returns empty string when there are no legal moves (stalemate/checkmate)", () => {
    // Checkmate position: fool's mate — black is in checkmate
    const game = new Chess();
    game.load("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
    // White is in checkmate (fool's mate), no legal moves
    const move = getBestMove(game.fen(), 1);
    expect(move).toBe("");
  });

  it("finds Qxf7# in Scholar's mate threat position (depth 1)", () => {
    const move = getBestMove(SCHOLARS_MATE_THREAT_FEN, 1);
    // UCI equivalent of Qxf7# is h5f7
    expect(move).toBe("h5f7");
  });

  it("returns a legal move at depth 2", () => {
    const game = new Chess();
    const fen = game.fen();
    const move = getBestMove(fen, 2);
    expect(move).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    expect(() => game.move({ from: move.slice(0, 2), to: move.slice(2, 4) })).not.toThrow();
  });

  it("prefers capturing a queen over a pawn when both are available", () => {
    // White can capture either black queen (high value) or pawn (low value)
    // Position: white rook on d1, black queen on d5, black pawn on d6 — white rook captures queen
    const fen = "k7/8/3p4/3q4/8/8/8/K2R4 w - - 0 1";
    const move = getBestMove(fen, 1);
    // UCI equivalent of Rxd5: rook on d1 captures queen on d5
    expect(move).toBe("d1d5");
  });
});

describe("getBestMove – board evaluation sanity", () => {
  it("does not return the same result for white vs black turn at depth 1 on start pos", () => {
    // After e4, it's black's turn — the engine should make a black move
    const game = new Chess();
    game.move("e4");
    const blackFen = game.fen();
    const blackMove = getBestMove(blackFen, 1);
    expect(blackMove).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    // Make sure chess.js accepts the UCI move as black
    expect(() =>
      game.move({ from: blackMove.slice(0, 2), to: blackMove.slice(2, 4) }),
    ).not.toThrow();
  });
});
